class Draft{    
    constructor(draftId, reviewId, authorId, contributorsId, open, draftDate, rating, review, responses) {
        this.draftId = draftId;
        this.reviewId = reviewId;
        this.authorId = authorId;
        this.contributorsId = contributorsId;
        this.open = open;
        this.draftDate = draftDate;
        this.rating = rating;
        this.review = review;


        if(responses)
            this.responses = responses;
        
        var selfLink = "reviews/" +  this.draftId + (open? "/open" + this.id : "/group/drafts/closed");
        this.self =  selfLink;
    }
}

module.exports = Draft;