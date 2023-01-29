## JSON Schemas

This folder contains the JSON Schemas.

The JSON schemas here described represent the object as they conceptually are inside the service. Please take note that the JSON schemas inside the "REST APIs implementation" folder are only used for validation of the body structures, and are obviously very different from those here reported.

These schemas offer a model of the objects as they are returned as output from the queries, and their internal constraints.

There are two new objects which were generated to implement the functions required (draft and response). A draft can be either open or closed, and closed drafts are retrieved alognside the associated responses. The uniqueness bond on open drafts is guaranteed by a control performed on the fields "reviewId" (which associates the draft to a review) and "open" which indicates the state of the draft. Responses are bond to a draft through the key "draftId", and can be only retrieved through the draft. The id of the draft is hidden and totally invisible to the user.

In order to implement a solution that is able manage as much together as possible both single and group reviews and their related constraints, the structure of the review inside the DB has changed, and the key of the user whom the review is assigned was moved to an external table, where multiple reviewers can reference the same review. For this reason a primary key was added to the reviews, which is the only way to reference the group reviews, while single reviews can be retrived both through their key and the old APIs which are still working.
