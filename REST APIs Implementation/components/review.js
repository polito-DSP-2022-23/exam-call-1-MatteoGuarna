class Review{    
    constructor(reviewId, filmId, reviewerId, reviewType, completed, reviewDate, rating, review) {
        this.reviewId = reviewId;
        this.filmId = filmId;
        this.reviewerId = reviewerId;
        this.completed = completed;
        this.reviewType = reviewType;

        if(reviewDate)
            this.reviewDate = reviewDate;
        if(rating)
            this.rating = rating;
        if(review)
            this.review = review;

        var selfLink = "/api/reviews/{reviewId}" + this.reviewId;
        this.self =  selfLink;
    }
}

module.exports = Review;


