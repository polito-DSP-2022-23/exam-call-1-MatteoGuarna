'use strict';

const Review = require('../components/review');
const User = require('../components/user');
const This =  require('../service/ReviewsService');
const db = require('../components/db');
var constants = require('../utils/constants.js');
const { getSingleReview } = require('../controllers/ReviewsController');


/**
 * Retrieve the reviews of the film with ID filmId
 * 
 * Input: 
 * - req: the request of the user
 * Output:
 * - list of the reviews
 * 
 **/
 exports.getFilmReviews = function(req) {
    return new Promise((resolve, reject) => {
        //get all reviews with filmId
        var sql = "SELECT id as reviewId, filmId, reviewType, completed, reviewDate, rating, review FROM reviews WHERE completed = 1 AND filmId = ?";
        var params = getPagination(req);
        if (params.length !== 2) sql = sql + " LIMIT ?,?";

        var reviews = []
        db.all(sql, params, async (err, rows) => {
            if (err) {
                reject(err);
            }
            for (var row of rows) {
                //edit each review by adding the array of IDs of the reviewers for that review
                try{
                    var reviewers = await getReviewers(row.reviewId);
                    var review = {
                        reviewId : row.reviewId,
                        filmId : row.filmId,
                        reviewType : row.reviewType,
                        reviewerId : reviewers,
                        completed : row.completed,
                        reviewDate : row.reviewDate,
                        rating : row.rating,
                        review : row.review
                    };
                    review = createReview(review);
                    reviews.push(review);   
                }
                catch(err){
                    reject(err);
                    return;
                }
            }
            resolve(reviews);
        });
    });
}


/**
 * Retrieve the number of reviews of the film with ID filmId
 * 
 * Input: 
* - filmId: the ID of the film whose reviews need to be retrieved
 * Output:
 * - total number of reviews of the film with ID filmId
 * 
 **/
 exports.getFilmReviewsTotal = function(filmId) {
  return new Promise((resolve, reject) => {
      var sqlNumOfReviews = "SELECT count(*) as total FROM reviews WHERE filmId = ? AND completed = 1 ";
      db.get(sqlNumOfReviews, [filmId], (err, size) => {
          if (err) {
              reject(err);
          } else {
              resolve(size.total);
          }
      });
  });
}


/**
 * Retrieve the public review by filmId and reviewerId
 * 
 * Input: 
 * - req: the request of the user
 * Output:
 * - list of the reviews
 * 
 **/
exports.getReviewsByFilmAndReviewer = function(req) {
    return new Promise((resolve, reject) => {
        //get all reviews with filmId
        var sql =   "SELECT r.reviewId, v.filmId, v.reviewType, r.reviewerId, v.completed, v.reviewDate, v.rating, v.review \
                    FROM reviewers r, reviews v \
                    WHERE v.filmId = ? AND r.reviewerId = ? AND r.reviewId = v.id AND v.completed = 1";
        var params = getPagination3(req);
        if (params.length !== 2) sql = sql + " LIMIT ?,?";

        var reviews = []
        db.all(sql, params, async (err, rows) => {
            if (err) {
                reject(err);
            }
            for (var row of rows) {
                //edit each review by adding the array of IDs of the reviewers for that review
                try{
                    var reviewers = await getReviewers(row.reviewId);
                    var review = {
                        reviewId : row.reviewId,
                        filmId : row.filmId,
                        reviewType : row.reviewType,
                        reviewerId : reviewers,
                        completed : row.completed,
                        reviewDate : row.reviewDate,
                        rating : row.rating,
                        review : row.review
                    };
                    review = createReview(review);
                    reviews.push(review);   
                }
                catch(err){
                    reject(err);
                    return;
                }
            }
            resolve(reviews);
        });
    });
}


/**
 * Retrieve the number of reviews of the film with ID filmId
 * 
 * Input: 
* - filmId: the ID of the film whose reviews need to be retrieved
 * Output:
 * - total number of reviews of the film with ID filmId
 * 
 **/
 exports.getReviewsByFilmAndReviewerTotal = function(filmId, reviewerId) {
  return new Promise((resolve, reject) => {
      var sqlNumOfReviews = "SELECT count(*) as total\
                            FROM reviewers r, reviews v\
                            WHERE r.reviewId = v.id AND r.reviewerId = ? AND v.filmId = ? AND v.completed = 1";
      db.get(sqlNumOfReviews, [reviewerId, filmId], (err, size) => {
          if (err) {
              reject(err);
          } else {
              resolve(size.total);
          }
      });
  });
}




/**
 * Retrieve a single review through filmId and reviewerId ID
 *
 * Input: 
 * - filmId: the ID of the film whose review needs to be retrieved
 * - reviewerId: the ID ot the reviewer
 * Output:
 * - the requested review
 * 
 **/
exports.getSingleReview = function(filmId, reviewerId) {
    return new Promise(async (resolve, reject) => {

        const sql = "SELECT r.reviewId, v.filmId, v.reviewType, r.reviewerId, v.completed, v.reviewDate, v.rating, v.review FROM reviewers r, reviews v WHERE r.reviewerId = ? AND r.reviewId = v.id AND v.filmId = ? AND v.reviewType = 0";
        db.all(sql, [reviewerId, filmId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else {
                rows[0].reviewerId = [rows[0].reviewerId]
                var review = createReview(rows[0]);
                resolve(review);
            }
        });
  });
}





/**
 * Retrieve the review of the film having reviewId as ID
 *
 * Input: 
 * - reviewId: the ID of the review which needs to be retrieved
 * Output:
 * - the requested review
 * 
 **/
 exports.getReviewById = function(reviewId) {

    return new Promise(async (resolve, reject) => {
        var review;
        const sql = "SELECT id as reviewId, filmId, reviewType, completed, reviewDate, rating, review FROM reviews WHERE id = ?";
        db.all(sql, [reviewId], async (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else {

                try{
                    var reviewers = await getReviewers(reviewId);
                    review = {
                        reviewId : rows[0].reviewId,
                        filmId : rows[0].filmId,
                        reviewType : rows[0].reviewType,
                        reviewerId : reviewers,
                        completed : rows[0].completed,
                        reviewDate : rows[0].reviewDate,
                        rating : rows[0].rating,
                        review : rows[0].review
                    }
                    review = createReview(review);
                    resolve(review);
                }
                catch(err){
                    reject(404);
                    return;
                }
            }
        });

  });
}


/**
 * Delete a review invitation
 *
 * Input: 
 * - filmId: ID of the film
 * - reviewerId: ID of the reviewer
 * - owner : ID of user who wants to remove the review
 * Output:
 * - no response expected for this operation
 * 
 **/
 exports.deleteSingleReview = function(filmId,reviewerId,owner) {
  return new Promise((resolve, reject) => {
      const sql1 = "SELECT owner, FROM films WHERE id = ? ";
      db.all(sql1, [filmId], (err, rows) => {
          if (err)
              reject(err);
          else if (rows.length === 0)
              reject(404);
          else if(owner != rows[0].owner) {
              reject("403A");
          }
          else if(rows[0].completed == 1) {
              reject("403B");
          }
          else {
                const sql2 = "SELECT r.reviewId FROM r reviewers, v reviews WHERE reviewerId = ? AND r.reviewId = v.id AND v.filmId = ? AND v.reviewType = 0";
                var reviewId = db.all(sql2, [reviewerId, filmId], (err, rows) => {
                    if (err)
                        reject(err);
                    else if (rows.length === 0)
                        reject(404);
                    else {
                        reviewerId = rows[0];
                    }
                })
                const sql3 = 'DELETE FROM reviews WHERE id = ?';
                db.run(sql3, [filmId, reviewerId], (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve(null);
              })
          }
      });
  });

}



/**
 * Issue a film review to a user
 *
 *
 * Input: 
 * - reviewerId : ID of the film reviewer
 * - filmId: ID of the film 
 * - owner: ID of the user who wants to issue the review
 * Output:
 * - no response expected for this operation
 * 
 **/


 exports.issueFilmReview = function(filmId, usersArray, loggedUser) {
  return new Promise((resolve, reject) => {
    const sql1 = "SELECT owner, private FROM films WHERE id = ?";
    db.all(sql1, [filmId], async (err, rows) => {
        if (err){
            reject(err);
        }
        else if (rows.length === 0){
            reject(404);
        }
        else if(loggedUser != rows[0].owner) {
            reject(401);
        }
        else if(rows[0].private == 1) {
            reject(403);
        }
        else {
            if ( usersArray.length == 1) { //check if a single review for film-user was already added
                try {
                    await invertSingleReview(filmId,usersArray[0]);
                }
                catch(err){
                        if (err == 409.1) reject(409.1)
                        else reject(500);
                        return;
                    }

                }
            }

            var sql2 = 'SELECT * FROM users' ;
            for (var i = 0; i < usersArray.length; i++) {
                if(i == 0) sql2 += ' WHERE id = ?';
                else sql2 += ' OR id = ?'
            }
            db.all(sql2, usersArray, async function(err, rows) {
                if (err) {
                    reject(err);
                } 
                else if (rows.length !== usersArray.length){
                    reject(409);
                }
                else {
                    var none = [];
                    const sql3 = 'select (case when min(minid) > 1 then 1 else coalesce(min(t.id) + 1, 0) end) as total from reviews t left outer join reviews t2 on t.id = t2.id - 1 cross join (select min(id) as minid from reviews t) const where t2.id is null;'
                    db.get(sql3, none, async function(err, size) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            var reviewId = size.total;
                            var reviewType = usersArray.length > 1 ? 1 : 0;
                            const sql4 = 'INSERT INTO reviews(id, filmId, reviewType, completed) VALUES(?,?,?,?)'
                            const sql5 = 'INSERT INTO reviewers(reviewId,reviewerId) VALUES(?,?)'
                            try {

                                await executeSQL('BEGIN TRANSACTION', []);
                                await executeSQL(sql4,[reviewId,filmId,reviewType,0]);
                                for (let user of usersArray) {
                                    await executeSQL(sql5,[reviewId,user]);
                                }
                                await executeSQL('COMMIT', []);
                                var output = await This.getReviewById(reviewId);
                                resolve(output);
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
                    })      
                }
            });
        });
    })
}



/**
 * Complete and update a review
 *
 * Input:
 * - review: review object (with only the needed properties)
 * - filmID: the ID of the film to be reviewed
 * - reviewerId: the ID of the reviewer
 * Output:
 * - no response expected for this operation
 * 
 **/

exports.updateSingleReview = function(review, filmId, reviewerId) {
    return new Promise((resolve, reject) => {
        const sql = "SELECT r.reviewId, v.filmId, v.reviewType, r.reviewerId, v.completed, v.reviewDate, v.rating, v.review FROM reviewers r, reviews v WHERE r.reviewerId = ? AND r.reviewId = v.id AND v.filmId = ? AND v.reviewType = 0";
        db.all(sql, [reviewerId, filmId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if (rows.length != 1)
                reject(500);
            else if (rows[0].completed == 1)
                reject(403);
            else {
                var sql2 = 'UPDATE reviews SET completed = ?';
                var parameters = [review.completed];
                if(review.reviewDate != undefined){
                sql2 = sql2.concat(', reviewDate = ?');
                parameters.push(review.reviewDate);
                } 
                if(review.rating != undefined){
                    sql2 = sql2.concat(', rating = ?');
                    parameters.push(review.rating);
                } 
                if(review.review != undefined){
                    sql2 = sql2.concat(', review = ?');
                    parameters.push(review.review);
                } 
                sql2 = sql2.concat(' WHERE id = ?');
                parameters.push(rows[0].reviewId);

                db.run(sql2, parameters, function(err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(null)
                    }
                })
            }
        });
    });
}




/**
 * Retrieve the reviews a user needs to complete (both single and group)
 * 
 * Input: 
 * - userId: the id of the user
 * Output:
 * - list of the reviews
 * 
 **/
exports.getUncompletedReviews = function(req) {
    return new Promise(function(resolve, reject) {
        var sql =  "SELECT v.id as reviewId, v.filmId, v.reviewType, v.completed, v.reviewDate, v.rating, v.review, r.reviewerId  \
                    FROM reviewers r, reviews v \
                    WHERE r.reviewId = v.id AND r.reviewerId = ? AND v.completed = 0 "
        var params = getPagination2(req);
        if (params.length !== 2) sql = sql + " LIMIT ?,?";

        var reviews = []
        db.all(sql, params, async (err, rows) => {
            if (err) {
                reject(err);
            }
            //resolve(params);
            //return;
            for (var row of rows) {
                //edit each review by adding the array of IDs of the reviewers for that review
                try{
                    var reviewers = await getReviewers(row.reviewId);
                    var review = {
                        reviewId : row.reviewId,
                        filmId : row.filmId,
                        reviewType : row.reviewType,
                        reviewerId : reviewers,
                        completed : row.completed,
                        reviewDate : row.reviewDate,
                        rating : row.rating,
                        review : row.review
                    };
                    review = createReview(review);
                    reviews.push(review);   
                }
                catch(err){
                    reject(err);
                    return;
                }
            }
            resolve(reviews);
        });
    });
}
  
  exports.getUncompletedReviewsTotal = function(userId) {
    return new Promise((resolve, reject) => {
        //var sqlNumOfReviews = "SELECT count(*) total FROM reviews WHERE filmId = ? ";
        var sqlNumOfReviews = "SELECT count(*) as total FROM reviewers r, reviews v WHERE r.reviewId = v.id AND r.reviewerId = ? AND v.completed = 0";
        db.get(sqlNumOfReviews, [userId], (err, size) => {
            if (err) {
                reject(err);
            } else {
                resolve(size.total);
            }
        });
    });
  }  




/**
 * Utility functions
 */
 const getPagination = function(req) {
  var pageNo = parseInt(req.query.pageNo);
  var size = parseInt(constants.OFFSET);
  var limits = [];
  limits.push(req.params.filmId);
  if (req.query.pageNo == null) {
      pageNo = 1;
  }
  limits.push(size * (pageNo - 1));
  limits.push(size);
  return limits;
}

const getPagination2 = function(req) {
    var pageNo = parseInt(req.query.pageNo);
    var size = parseInt(constants.OFFSET);
    var limits = [];
    limits.push(req.user.id);
    if (req.query.pageNo == null) {
        pageNo = 1;
    }
    limits.push(size * (pageNo - 1));
    limits.push(size);
    return limits;
}

const getPagination3 = function(req) {
    var pageNo = parseInt(req.query.pageNo);
    var size = parseInt(constants.OFFSET);
    var limits = [];
    limits.push(req.params.filmId);
    limits.push(req.params.reviewerId);
    if (req.query.pageNo == null) {
        pageNo = 1;
    }
    limits.push(size * (pageNo - 1));
    limits.push(size);
    return limits;
}


const getReviewers = function(reviewId) {
    return new Promise((resolve, reject) => {
        const sql = "SELECT reviewerId FROM reviewers WHERE reviewId = ? ";;
        db.all(sql, [reviewId], (err, rows) => {
            if (err) {
                reject(err);
            } 
            else {
                var reviewers = [];
                for (var r of rows){
                    reviewers.push(r.reviewerId)
                }
                resolve(reviewers);
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


const invertSingleReview = function(filmId, reviewerId){
    return new Promise((resolve, reject) => {
        const sql = "SELECT count(*) as total FROM reviewers r, reviews v WHERE r.reviewerId = ? AND r.reviewId = v.id AND v.filmId = ? AND v.reviewType = 0";
        db.get(sql, [reviewerId, filmId], (err, size) => {
            if (err){
                reject(err)
            }
            else if (size.total != 0){
                reject(409.1)
            }
            else{
                resolve()
            }
        });
    })
}



const createReview = function(review) {
    var completed = (review.completed === 1) ? true : false;
    var reviewType = (review.reviewType === 1) ? "group" : "single";
    return new Review(review.reviewId, review.filmId, review.reviewerId, reviewType, completed, review.reviewDate, review.rating, review.review);
  }
  
