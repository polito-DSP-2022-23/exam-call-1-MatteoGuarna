class Draft{    
    constructor(draftId, reviewId, authorId, contributorsId, open, draftDate, rating, review, responses) {
        this.draftId = draftId;
        this.reviewId = reviewId;
        this.authorId = authorId;
        this.contributorsId = contributorsId.slice();
        this.open = open;
        this.draftDate = draftDate;
        this.rating = rating;
        this.review = review;


        if(!open)
            this.responses = responses.slice();
        
        var selfLink = "api/reviews/" +  this.reviewId + "/group/drafts/" + (open? "open" : "closed");
        this.self =  selfLink;
    }
}

module.exports = Draft;