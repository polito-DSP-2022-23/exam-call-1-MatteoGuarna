'use strict';

var utils = require('../utils/writer.js');
var Reviews = require('../service/ReviewsService');
var constants = require('../utils/constants.js');
var Films = require('../service/FilmsService');

module.exports.getFilmReviews = function getFilmReviews (req, res, next) {

    //retrieve a list of reviews
    var numOfReviews = 0;
    var next=0;

    Reviews.getFilmReviewsTotal(req.params.filmId)
      .then(function(response) {
        
        numOfReviews = response;
        Reviews.getFilmReviews(req)
        .then(function(response) {
          if (req.query.pageNo == null) var pageNo = 1;
          else var pageNo = req.query.pageNo;
          var totalPage = Math.ceil(numOfReviews / constants.OFFSET);
          next = Number(pageNo) + 1;
          if (pageNo > totalPage) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': "The page does not exist." }], }, 404);
          } 
          else if (pageNo == totalPage) {
            utils.writeJson(res, {
              totalPages: totalPage,
              currentPage: pageNo,
              totalItems: numOfReviews,
              reviews: response
              });
          } 
          else {
            utils.writeJson(res, {
              totalPages: totalPage,
              currentPage: pageNo,
              totalItems: numOfReviews,
              reviews: response,
              next: "/api/films/public/" + req.params.taskId +"?pageNo=" + next
            });
          }
      })
      .catch(function(response) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      });
    })
    .catch(function(response) {
      utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
  });
  
};

module.exports.getReviewsByFilmAndReviewer = function getReviewsByFilmAndReviewer (req, res, next) {
  //retrieve a list of reviews
  var numOfReviews = 0;
  var next=0;

  Reviews.getReviewsByFilmAndReviewerTotal(req.params.filmId, req.params.reviewerId)
  .then(function(response) {
    
    numOfReviews = response;
    Reviews.getReviewsByFilmAndReviewer(req)
    .then(function(response) {
      if (req.query.pageNo == null) var pageNo = 1;
      else var pageNo = req.query.pageNo;
      var totalPage = Math.ceil(numOfReviews / constants.OFFSET);
      next = Number(pageNo) + 1;
      if (pageNo > totalPage) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': "The page does not exist." }], }, 404);
      } 
      else if (pageNo == totalPage) {
        utils.writeJson(res, {
          totalPages: totalPage,
          currentPage: pageNo,
          totalItems: numOfReviews,
          reviews: response
          });
      } 
      else {
        utils.writeJson(res, {
          totalPages: totalPage,
          currentPage: pageNo,
          totalItems: numOfReviews,
          reviews: response,
          next: "/api/films/public/" + req.params.filmId + "/reviews/" + req.params.reviewerId + "?pageNo=" + next
        });
      }
    })
    .catch(function(response) {
      utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
    });
  })
  .catch(function(response) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
  });
}

module.exports.getSingleReview = function getSingleReview (req, res, next) {

    Reviews.getSingleReview(req.params.filmId, req.params.reviewerId)
        .then(function(response) {
            utils.writeJson(res, response);
        })
        .catch(function(response) {
            if (response == 404){
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};

module.exports.getReviewById = function getReviewById (req, res, next) {
  
  Reviews.getReviewById(req.params.reviewId)
  .then(function(response) {
      utils.writeJson(res, response);
  })
  .catch(function(response) {
      if (response == 404){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
      }
      else {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
  });
};


module.exports.deleteSingleReview = function deleteSingleReview (req, res, next) {

  Reviews.deleteSingleReview(req.params.filmId, req.params.reviewerId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response, 204);
    })
    .catch(function (response) {
      if(response == "403A"){
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
      }
      else if(response == "403B"){
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review has been already completed, so the invitation cannot be deleted anymore.' }], }, 403);
      }
      else if (response == 404){
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
      }
      else {
        utils.writeJson(res, {errors: [{ 'param': 'Server', 'msg': response }],}, 500);
      }
    });
};

module.exports.issueFilmReview = function issueFilmReview (req, res, next) {
  var body;
    try {
      body = JSON.parse(req.body);
      body = body.users;
    }
    catch(err){
      utils.writeJson(res, { errors: [{  'param': 'Server', 'msg':'unknown format, a JSON object with key \"users\" andcontaining an array is required' }], }, 400);
      return;
    }
    var usersArray = (Array.isArray(body) && body.length > 0) ? body.slice() : [req.user.id];
    Reviews.issueFilmReview(Number(req.params.filmId), usersArray, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response, 201);
    })
    .catch(function (response) {
      if(response == 401){
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 401);
      }
      if(response == 403){
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film is private' }], }, 403);
      }
      else if (response == 404){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The public film does not exist.' }], }, 404);
      }
      else if (response == 409){
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user with ID reviewerId does not exist.' }], }, 409);
      }
      else if (response == 409.1){
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'A single review was already assigned to this user for this film.' }], }, 409);
      }
      else {
          utils.writeJson(res, {errors: [{ 'param': 'Server', 'msg': response }],}, 500);
      }
    });
};

module.exports.updateSingleReview = function updateSingleReview (req, res, next) {
  var body = JSON.parse(req.body);
  
  if(req.params.reviewerId != req.user.id){
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The reviewerId is not equal the id of the requesting user.' }], }, 400);
  }
  else if(body.completed == undefined) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The completed property is absent.' }], }, 400);
  }
  else if(body.completed == false) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The completed property is false, but it should be set to true.' }], }, 400);
  }
  else {
    Reviews.updateSingleReview(body, req.params.filmId, req.params.reviewerId)
    .then(function(response) {
        utils.writeJson(res, response, 204);
    })
    .catch(function(response) {
        if(response == 403){
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review was already completed' }], }, 403);
        }
        else if (response == 404){
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'No single review exists with the given parameters.' }], }, 404);
        }
        else {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
        }
    });
  }
};


module.exports.getUncompletedReviews = function getUncompletedReviews (req, res, next) {
  //retrieve a list of reviews
  var numOfReviews = 0;
  var next=0;

  Reviews.getUncompletedReviewsTotal(req.user.id)
    .then(function(response) {
      numOfReviews = response;
      Reviews.getUncompletedReviews(req)
      .then(function(response) {
        if (req.query.pageNo == null) var pageNo = 1;
        else var pageNo = req.query.pageNo;
        var totalPage = Math.ceil(numOfReviews / constants.OFFSET);
        next = Number(pageNo) + 1;
        if (pageNo > totalPage) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': "The page does not exist." }], }, 404);
        } 
        else if (pageNo == totalPage) {
          utils.writeJson(res, {
            totalPages: totalPage,
            currentPage: pageNo,
            totalItems: numOfReviews,
            reviews: response
            });
        } 
        else {
          utils.writeJson(res, {
            totalPages: totalPage,
            currentPage: pageNo,
            totalItems: numOfReviews,
            reviews: response,
            next: "/api/films/public/" + req.params.filmId + "/reviews/toComplete/" + req.params+ "?pageNo=" + next
          });
        }
    })
    .catch(function(response) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
    });
  })
  .catch(function(response) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
});
};

