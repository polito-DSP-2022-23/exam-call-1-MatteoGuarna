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
                    else if (!rows.contains(userId)){
                        reject(403) //user is not part of group, so can't create a draft
                    }
                    else{
                        var contributorsId = [];
                        for (var row of rows){
                            if (row!=userId) contributorsId.push(row);
                        }
                        contributorsId = "[" + String(contributorsId) + "]";
                        var sql3 = "SELECT count(*) FROM drafts WHERE reviewId = ? AND open = 0"
                        db.all(sql3, [reviewId], async (err, rows) => {
                            if (err) {
                                reject(err);
                            }
                            else if (rows.length < 2){
                                reject(510) //internal inconsistency, review should be deleted
                            }
                            else if(rows.length < 2){
                                reject(409.1); //an open draft already exists
                            }
                            else {
                                var sql4 = "INSERT INTO drafts (reviewId, authorId, contributorsId, open,draftDate,rating,review) VALUES(?,?,?,1,?,?,?)";
                                db.run(sql4, [reviewId, userId, contributorsId, draft.draftDate,draft.rating,draft.review], async (err) => {
                                    if(err) reject(err);
                                    else {
                                        try{
                                            var draft = This.getOpenDraft(userId,reviewId);
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


exports.getClosedDratfts = function(req) {
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
                    for (var draft of rows){
                        var contributorsId = JSON.parse(rows[0].contributorsId);
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



exports.getClosedDratftsTotal = function(userId, reviewId) {
    return new Promise((resolve, reject) => {

        var sql1 = "SELECT id as draftId, authorId, contributorsId FROM drafts WHERE reviewId = ? AND open = 0";
        db.all(sql1, [reviewId], async (err, rows) => {
            if (err) {
                reject(err);
            }
            else if(rows.length == 0) {
                resolve(0); //no draft found
            }
            else{
                var n = 0;
                for (var r of rows) {
                    var contributorsId = JSON.parse(r.contributorsId);
                    if (contributorsId.includes(userId) || userId != r.authorId){
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
    return new Draft(draft.draftId, draft.reviewId, draft.authorId, draft.contributorsId, open, draft.draftDate, draft.rating, draft.review);
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
                    if (!contributorsId.includes(r)) {
                        reject(500.1);
                        return;
                    }
                } 
                resolve(rows.map(r => createResponse(r)))
            }
        });
    });
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
