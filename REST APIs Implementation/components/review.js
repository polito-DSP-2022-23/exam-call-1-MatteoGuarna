class Review{    
    constructor(reviewId, filmId, reviewerId, reviewType, completed, reviewDate, rating, review) {
        this.reviewId = reviewId;
        this.filmId = filmId;
        this.reviewerId = reviewerId;
        //for (var r of reviewerId) this.reviewerId.push(r)
        this.completed = completed;
        this.reviewType = reviewType;

        if(reviewDate)
            this.reviewDate = reviewDate;
        if(rating)
            this.rating = rating;
        if(review)
            this.review = review;

        var selfLink = "/api/reviews/" + this.reviewId;
        this.self =  selfLink;
    }
}

module.exports = Review;


