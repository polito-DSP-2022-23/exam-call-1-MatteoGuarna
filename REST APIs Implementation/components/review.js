class Review{    
    constructor(reviewId, filmId, reviewerId, reviewType, completed, reviewDate, rating, review) {
        this.reviewId = reviewId;
        this.filmId = filmId;
        this.reviewerId = reviewerId;
        this.reviewType = reviewType;
        this.completed = completed;

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


