'use strict';

var utils = require('../utils/writer.js');
var Reviews = require('../service/ReviewsService');
var constants = require('../utils/constants.js');
var Drafts = require('../service/DraftsService');
const User = require('../components/user.js');
const Date = require('../components/date.js');

module.exports.issueDraft = function issueDraft (req, res, next) {
    var draft;
    //parse the body
    try{
      draft = JSON.parse(req.body);
    }
    catch(err){
      draft = req.body;
    }

    if(draft.rating === undefined || draft.rating < 0 || draft.rating > 10|| draft.review === undefined) {
      utils.writeJson(res, { errors: [{  'param': 'Server', 'msg':'unknown format, a JSON Draft object with following fields: \'rating\' [0-10], \'review\'' }], }, 400);
      return;
    }

    draft = {
      draftDate : Date.createDate(),
      rating : draft.rating,
      review : draft.review

    }
    Drafts.issueDraft(Number(req.params.reviewId), req.user.id, draft)
    .then(function(response) {
        utils.writeJson(res, response, 201);
    })
    .catch(function(response) {
        if(response == 401){
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 401);
          }
          else if(response == 403){
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not part of the group, so can\'t create a draft' }], }, 403);
          }
          else if (response == 404){
              utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
          }
          else if (response == 409){
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review was already completed.' }], }, 409);
          }
          else if (response == 409.1){
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'A draft was already open for this group review.' }], }, 409);
          }
          else {
              utils.writeJson(res, {errors: [{ 'param': 'Server', 'msg': response }],}, 500);
          }
    });
};

module.exports.getOpenDraft = function getOpenDraft (req, res, next) {

    Drafts.getOpenDraft(req.user.id,Number(req.params.reviewId))
    .then(function(response) {
        utils.writeJson(res, response);
    })
    .catch(function(response) {
        if (response == 403){
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user does not partecipate to the group review.' }], }, 403);
        }
        else if (response == 404){
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'There\'s no open draft at the time.' }], }, 404);
        }
        else {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
        }
    });
};



module.exports.getClosedDrafts = function getClosedDrafts (req, res, next) {

    //retrieve a list of reviews
    var numOfDrafts = 0;
    var next=0;

    Drafts.getClosedDraftsTotal(req.user.id, Number(req.params.reviewId))
      .then(function(response) {
        
        numOfDrafts = response;
        Drafts.getClosedDrafts(req)
        .then(function(response) {
          if (req.query.pageNo == null) var pageNo = 1;
          else var pageNo = Number(req.query.pageNo);
          var totalPage = Math.ceil(numOfDrafts / constants.OFFSET);
          next = Number(pageNo) + 1;
          if (pageNo > totalPage) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': "The page does not exist." }], }, 404);
          } 
          else if (pageNo == totalPage) {
            utils.writeJson(res, {
              totalPages: totalPage,
              currentPage: pageNo,
              totalItems: numOfDrafts,
              drafts: response
              });
          } 
          else {
            utils.writeJson(res, {
              totalPages: totalPage,
              currentPage: pageNo,
              totalItems: numOfDrafts,
              drafts: response,
              next: "/api/reviews/" + req.params.reviewId + "/group/drafts/closed" +"?pageNo=" + next
            });
          }
      })
      .catch(function(response) {
        if (response == 403){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user does not partecipate to the group review.' }], }, 403);
        }
        else if (response == 404){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The draft does not exist.' }], }, 404);
        }
        else if (response == 500.1){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'Internal inconsistency inside the DB.' }], }, 500);
        }
        else {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
        }
      });
    })
    .catch(function(response) {
      if (response == 404){
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The draft does not exist.' }], }, 404);
      }
      else {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
  });
};



module.exports.issueResponse = function issueResponse (req, res, next) {
  var response;
  //parse the body
  try{
    response = JSON.parse(req.body);
  }
  catch(err){
    response = req.body;
  }

  if(response.agree == undefined || ((response.agree == false || response.agree == 0) && response.response == undefined)) {
    utils.writeJson(res, { errors: [{  'param': 'Server', 'msg':'unknown format, a JSON Draft object with following fields: \'agree\', \'response\' [required only if \'agree\' = false] ' }], }, 400);
    return;
  }

  if (response.agree == false) response.agree = 0;
  if (response.agree == true) response.agree = 1;

  Drafts.issueResponse(Number(req.params.reviewId), req.user.id, response)
  .then(function(response) {
      utils.writeJson(res, response, 201);
  })
  .catch(function(response) {
      if(response == 401){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 401);
        }
        else if(response == 403){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not part of the group, so can\'t respond to the draft' }], }, 403);
        }
        else if(response == 403.1){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is the author of the draft, so can\'t submit a response' }], }, 403);
        }
        else if (response == 404){
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
        }
        else if (response == 409){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review was already completed.' }], }, 409);
        }
        else if (response == 409.1){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review has no open draft associated.' }], }, 409);
        }
        else if (response == 409.2){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user has already submitted a response for the review.' }], }, 409);
        }
        else {
            utils.writeJson(res, {errors: [{ 'param': 'Server', 'msg': response }],}, 500);
        }
  });
};