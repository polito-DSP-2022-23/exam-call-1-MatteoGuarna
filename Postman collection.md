## The following JSON objects are examples of the input body required by the following APIs (all new APIs which need a body are reported)
</br>
A Postman collection with all examples is available at the following link: https://api.postman.com/collections/20784027-8fdaf719-9630-4833-97be-82e2c192807c?access_key=PMAT-01GQYN2WWZM9SQP857ZRPZGQPC

</br>

POST /api/films/public/7/reviews (requires user #5 to be logged in)
```
{
    "users" : [2,4,5]
}
```

</br>

PUT /api/films/public/6/reviews/1/single (requires user #1 to be logged in)
```
{
    "completed": true,
    "rating": 9,
    "review": "This is a new review"
}
```

</br>

POST /api/reviews/15/group/drafts/open (requires user #2, #3, or #6 to be logged in)
```
{
    "rating" : 6,
    "review" : "the middle part was actually mildly annoying"
}
```

</br>

POST /api/reviews/16/group/drafts/open/responses (requires user #5 or #6 to be logged in)
```
{
    "agree": false,
    "response": "how so? it was breathtaking from the very beginning.."
}
```