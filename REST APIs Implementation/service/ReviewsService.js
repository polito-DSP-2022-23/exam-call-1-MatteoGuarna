'use strict';

const Review = require('../components/review');
const User = require('../components/user');
const db = require('../components/db');
var constants = require('../utils/constants.js');


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
            //resolve(rows)
            for (var row of rows) {
                var reviewers = [];
                //edit each review by adding the array of IDs of the reviewers for that review
                try{
                    var reviewers = await getReviewers(row.reviewId);
                    var review = new Review({
                        reviewId : row.reviewId,
                        filmId : row.filmId,
                        reviewType : row.reviewType,
                        reviewerId : reviewers,
                        completed : row.completed,
                        reviewDate : row.reviewDate,
                        rating : row.rating,
                        review : row.review
                    });
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
      var sqlNumOfReviews = "SELECT count(*) total FROM reviews WHERE filmId = ? ";
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
 * Retrieve the review of the film having reviewId as ID
 *
 * Input: 
 * - filmId: the ID of the film whose review needs to be retrieved
 * - reviewerId: the ID ot the reviewer
 * Output:
 * - the requested review
 * 
 **/
 exports.getReview = function(reviewId) {
    return new Promise(async (resolve, reject) => {
        var reviewers;

        try{
            reviewers = await getReviewers(reviewId);

            const sql = "SELECT id as reviewId, filmId, reviewType, completed, reviewDate, rating, review FROM reviews WHERE id = ?";
            db.all(sql, [reviewId], (err, rows) => {
                if (err)
                    reject(err);
                else if (rows.length === 0)
                    reject(404);
                else {
                    var review = {
                        reviewId : rows[0].reviewId,
                        filmId : rows[0].filmId,
                        reviewType : rows[0].reviewType,
                        reviewerId : reviewers,
                        completed : rows[0].completed,
                        reviewDate : rows[0].reviewDate,
                        rating : rows[0].rating,
                        review : rows[0].review
                    }
                    var review = Review(review);
                    resolve(review);
                }
            });
        }catch(err){
            reject(404);
            return;
        }

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
 exports.issueFilmReview = function() {
  return new Promise((resolve, reject) => {
      const sql1 = "SELECT owner, private FROM films WHERE id = ?";
      db.all(sql1, [invitations[0].filmId], (err, rows) => {
          if (err){
                reject(err);
          }
          else if (rows.length === 0){
              reject(404);
          }
          else if(owner != rows[0].owner) {
              reject(403);
          } else if(rows[0].private == 1) {
              reject(404);
          }
          else {
            var sql2 = 'SELECT * FROM users' ;
            var invitedUsers = [];
            for (var i = 0; i < invitations.length; i++) {
                console.log(invitations[i]);
                if(i == 0) sql2 += ' WHERE id = ?';
                else sql2 += ' OR id = ?'
                invitedUsers[i] = invitations[i].reviewerId;
            }
            db.all(sql2, invitedUsers, async function(err, rows) {
                if (err) {
                    reject(err);
                } 
                else if (rows.length !== invitations.length){
                    reject(409);
                }
                else {
                    const sql3 = 'INSERT INTO reviews(filmId, reviewerId, completed) VALUES(?,?,0)';
                    var finalResult = [];
                    for (var i = 0; i < invitations.length; i++) {
                        var singleResult;
                        try {
                            singleResult = await issueSingleReview(sql3, invitations[i].filmId, invitations[i].reviewerId);
                            finalResult[i] = singleResult;
                        } catch (error) {
                            reject ('Error in the creation of the review data structure');
                            break;
                        }
                    }

                    if(finalResult.length !== 0){
                        resolve(finalResult);
                    }        
                }
            }); 
          }
      });
  });
}

const issueSingleReview = function(sql3, filmId, reviewerId){
    return new Promise((resolve, reject) => {
        db.run(sql3, [filmId, reviewerId], function(err) {
            if (err) {
                reject('500');
            } else {
                var createdReview = new Review(filmId, reviewerId, false);
                resolve(createdReview);
            }
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

      const sql1 = "SELECT * FROM reviews WHERE filmId = ? AND reviewerId = ?";
      db.all(sql1, [filmId, reviewerId], (err, rows) => {
          if (err)
              reject(err);
          else if (rows.length === 0)
              reject(404);
          else if(reviewerId != rows[0].reviewerId) {
              reject(403);
          }
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
            sql2 = sql2.concat(' WHERE filmId = ? AND reviewerId = ?');
            parameters.push(filmId);
            parameters.push(reviewerId);

            db.run(sql2, parameters, function(err) {
              if (err) {
              reject(err);
              } else {
              resolve(null);
            }
           })
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

const getReviewers = function(reviewId) {
    return new Promise((resolve, reject) => {
        const sql = "SELECT reviewerId FROM reviewers WHERE reviewId = ? ";;
        db.all(sql, [reviewId], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                var reviewers = [];
                for (var r of rows){
                    reviewers.push(r.reviewerId)
                }
                resolve(reviewers);
            }
        });
    });
  }