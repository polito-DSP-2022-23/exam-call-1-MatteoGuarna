class response{    
    constructor(draftId, responderId, agree, response) {
        this.draftId = draftId;
        this.responderId = responderId;
        this.agree = agree;


        if(!agree)
            this.response = response;
        
    }
}

module.exports = Draft;