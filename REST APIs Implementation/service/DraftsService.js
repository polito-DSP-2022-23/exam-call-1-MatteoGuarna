'use strict';

const Draft = require('../components/draft');
const Response = require('../components/response');
const User = require('../components/user');
const Reviews =  require('../service/ReviewsService');
const This =  require('../service/DraftsService');
const db = require('../components/db');
var constants = require('../utils/constants.js');

/**
 * Issue a new draft
 * 
 * Input: 
 * - req: the request of the user
 * Output:
 * - list of the reviews
 * 
 **/
exports.issueDraft = function(reviewId, userId, draft) {
    return new Promise((resolve, reject) => {
        var sql = "SELECT id as reviewId, completed FROM reviews WHERE id =  ? AND reviewType = 1";
        
        db.all(sql, [reviewId], async (err, rows) => {
            if (err) {
                reject(err);
            }
            else if(rows.length == 0) {
                reject(404) //no group review found
            }
            else if (rows[0].completed == 1){
                reject(409) //already completed
            }
            else{
                var sql2 = "SELECT reviewerId FROM reviewers WHERE reviewId = ?"
                db.all(sql2, [reviewId], async (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else if (rows.length < 2){
                        reject(510) //internal inconsistency, review should be deleted
                    }
                    else{
                        var contributorsId = [];
                        var found = false;
                        for (var row of rows) {
                            if (userId != row.reviewerId) contributorsId.push(row.reviewerId);
                            else found = true;
                        }
                        if (!found){
                            reject(403);    //user is not part of group, so can't create a draft
                            return;
                        }
                        contributorsId = "[" + String(contributorsId) + "]";
                        var sql3 = "SELECT count(*) as total FROM drafts WHERE reviewId = ? AND open = 1"
                        db.get(sql3, [reviewId], async (err, row) => {
                            if (err) {
                                reject(err);
                            }
                            else if(row.total != 0){
                                reject(409.1); //an open draft already exists
                            }
                            else {
                                var sql4 = "INSERT INTO drafts (reviewId, authorId, contributorsId, open,draftDate,rating,review) VALUES(?,?,?,1,?,?,?)";
                                db.run(sql4, [reviewId, userId, contributorsId, draft.draftDate,draft.rating,draft.review], async (err) => {
                                    if(err) reject(err);
                                    else {
                                        try{
                                            var draft = await This.getOpenDraft(userId,reviewId);
                                            resolve(draft);
                                        }
                                        catch(err){
                                            reject(err);
                                        }
                                    }
                                });
                            }
                        })
                    }
                });
            }
        });
    });
}



exports.getOpenDraft = function(userId, reviewId) {
    return new Promise((resolve, reject) => {
        var draft;

        var sql1 = "SELECT id as draftId, reviewId, authorId, contributorsId, open, draftDate, rating, review FROM drafts WHERE reviewId = ? AND open = 1";
        db.all(sql1, [reviewId], async (err, rows) => {
            if (err) {
                reject(err);
            }
            else if(rows.length == 0) {
                reject(404); //no draft found
            }
            else{
                var contributorsId;
                try{
                    contributorsId = JSON.parse(rows[0].contributorsId);
                    if (!contributorsId.includes(userId) && userId != rows[0].authorId){
                        reject(403);
                        return;
                    }
                    draft = rows[0];
                    draft.contributorsId = contributorsId;
                    draft = createDraft(draft);
                    resolve(draft);
                }
                catch(err){
                    reject(500)
                }
            }
        });
    });
}


exports.getClosedDrafts = function(req) {
    var userId = req.user.id;
    return new Promise((resolve, reject) => {
        var drafts = [];

        var sql1 = "SELECT id as draftId, reviewId, authorId, contributorsId, open, draftDate, rating, review FROM drafts WHERE reviewId = ? AND open = 0";
        var params = getPagination(req);
        if (params.length !== 2) sql1 = sql1 + " LIMIT ?,?";

        db.all(sql1, params, async (err, rows) => {
            if (err) {
                reject(err);
            }
            else if(rows.length == 0) {
                reject(404); //no draft found
            }
            else{
                try{
                    for (let i = 0; i < rows.length; i ++){
                        var draft = rows[i];
                        var contributorsId = JSON.parse(rows[i].contributorsId);
                        if (contributorsId.includes(userId) || userId == draft.authorId){
                            var responses = await getResponses(draft.draftId, contributorsId);
                            var draftCompleted = {
                                draftId : draft.draftId,
                                reviewId : draft.reviewId,
                                authorId : draft.authorId,
                                contributorsId : contributorsId,
                                open : draft.open,
                                draftDate : draft.draftDate,
                                rating : draft.rating,
                                review : draft.review,
                                responses : responses
                            }
                            drafts.push(createDraft(draftCompleted));
                        }
                    }
                    resolve(drafts);
                }
                catch(err){
                    if (err == 500.1) reject(500.1);
                    else  if (err == 403) reject(403);
                    else reject(500);
                }

            }
        });
    });
}



exports.getClosedDraftsTotal = function(userId, reviewId) {
    return new Promise((resolve, reject) => {

        var sql1 = "SELECT id as draftId, authorId, contributorsId FROM drafts WHERE reviewId = ? AND open = 0";
        db.all(sql1, [reviewId], async (err, rows) => {
            if (err) {
                reject(err);
            }
            else if(rows.length == 0) {
                reject(404); //no draft found
            }
            else{
                var n = 0;
                for (var r of rows) {
                    var contributorsId = JSON.parse(r.contributorsId);
                    if (contributorsId.includes(userId) || userId == r.authorId){
                        n +=1 ;
                    }
                }
                resolve(n);
            }
        });
    });
}

const createDraft = function(draft) {
    var open = (draft.open === 1) ? true : false;
    return new Draft(draft.draftId, draft.reviewId, draft.authorId, draft.contributorsId, open, draft.draftDate, draft.rating, draft.review, draft.responses);
}



const getResponses = function(draftId, contributorsId) {
    return new Promise((resolve, reject) => {

        var sql1 = "SELECT responderId, agree, response FROM responses WHERE draftId = ?";
        db.all(sql1, [draftId], async (err, rows) => {
            if (err) {
                reject(err);
            }
            else if(rows.length != contributorsId.length) {
                reject(500.1); //internal inconsistency
            }
            else{  
                for (var r of rows) {
                    if (!contributorsId.includes(r.responderId)) {
                        reject(500.1);
                        return;
                    }
                } 
                resolve(rows.map(r => createResponse(r)))
            }
        });
    });
}





exports.issueResponse = function(reviewId, userId, response) {
    return new Promise((resolve, reject) => {

        var sql = "SELECT id as reviewId, completed FROM reviews WHERE id =  ? AND reviewType = 1";
        
        db.all(sql, [reviewId], async (err, rows) => {
            if (err) {
                reject(err);
            }
            else if(rows.length == 0) {
                reject(404) //no group review found
            }
            else if (rows[0].completed == 1){
                reject(409) //already completed
            }
            else{
                var sql2 = "SELECT reviewerId FROM reviewers WHERE reviewId = ?"
                db.all(sql2, [reviewId], async (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else if (rows.length < 2){
                        reject(510) //internal inconsistency, review should be deleted
                    }
                    else{
                        var contributorsId = [];
                        var found = false;
                        for (var row of rows) {
                            if (userId != row.reviewerId) contributorsId.push(row.reviewerId);
                            else found = true;
                        }
                        if (!found){
                            reject(403);    //user is not part of group, so can't respond to draft
                            return;
                        }
                        var contributorsCount = contributorsId.length;
                        var sql3 = "SELECT id as draftId, authorId, contributorsId, draftDate, rating, review FROM drafts WHERE reviewId = ? AND open = 1"
                        db.all(sql3, [reviewId], async (err, rows) => {
                            if (err) {
                                reject(err);
                            }
                            else if(rows.length == 0){
                                reject(409.1); //no open draft already exists
                            }
                            else if (rows[0].authorId == userId){
                                reject(403.1); //user is author of draft
                            }
                            else {
                                var draft = rows[0];

                                var sql4 = "SELECT responderId, agree FROM responses WHERE draftId = ?";
                                db.all(sql4, [draft.draftId], async (err, rows) => {
                                    if(err) reject(err);
                                    else {
                                        found = false;
                                        var agreeCount = 0;
                                        var responsesCount = 0
                                        for (var row of rows) {
                                            responsesCount += 1;
                                            if (userId == row.responderId) {
                                                found = true;
                                                break;
                                            }
                                            if (row.agree == 1) agreeCount += 1;
                                        }
                                        if (found) {
                                            reject(409.2);
                                            return;
                                        }
                                        try{
                                            var sql5 = "INSERT INTO responses (draftId, responderId, agree, response) VALUES(?,?,?,?)";

                                            await executeSQL('BEGIN TRANSACTION', []);
                                            await executeSQL(sql5, [draft.draftId,userId,response.agree, (response.response ? response.response : null)]);
                                            responsesCount += 1;
                                            agreeCount += response.agree;
                                            if (contributorsCount == responsesCount) {
                                                await executeSQL('UPDATE drafts SET open = 0 WHERE id = ?', [draft.draftId]);
                                                if (contributorsCount  == agreeCount) {
                                                    await executeSQL('UPDATE reviews SET completed = 1, reviewDate = ?, rating = ?, review = ? WHERE id = ?',
                                                        [draft.draftDate, draft.rating, draft.review,reviewId]
                                                    );
                                                }
                                            }

                                            await executeSQL('COMMIT', []);

                                            var responseToReturn = {
                                                response: createResponse(response),
                                                draftStatusChanged : (contributorsCount == responsesCount ),
                                                reviewApproved : (response.agree == 1 && contributorsCount == agreeCount)

                                            }
                                            resolve(responseToReturn);
  
                                        }
                                        catch(err){
                                            try {
                                                await executeSQL('ROLLBACK TRANSACTION', []);
                                                reject(err);
                                            }
                                            catch(err){
                                                reject(err);
                                            }
                                        }
                                    }
                                });
                            }
                        })
                    }
                });
            }
        });
    });
}




const executeSQL = function(sql, params){
    return new Promise((resolve, reject) => {

        db.run(sql, params, function(err) {
            if (err) {
                reject('500');
            }
            else resolve();
        });
    })
}



const getPagination = function(req) {
    var pageNo = parseInt(req.query.pageNo);
    var size = parseInt(constants.OFFSET);
    var limits = [];
    limits.push(Number(req.params.reviewId));
    if (req.query.pageNo == null) {
        pageNo = 1;
    }
    limits.push(size * (pageNo - 1));
    limits.push(size);
    return limits;
}


const createResponse = function(response) {
    var agree = (response.agree === 1) ? true : false;
    return new Response(response.responderId, agree, response.response);
}