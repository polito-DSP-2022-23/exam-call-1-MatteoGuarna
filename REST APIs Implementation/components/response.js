class Response{    
    constructor(responderId, agree, response) {
        this.responderId =responderId; 
        this.agree = agree;


        if(response)
            this.response = response; 
    }
}

module.exports = Response;