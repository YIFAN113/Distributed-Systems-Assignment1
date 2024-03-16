## Serverless REST Assignment.

__Name:__ Yifan Gu

__Video demonstration:__ [https://youtu.be/7f5PV_X55V0](https://youtu.be/7f5PV_X55V0)

This repository contains an implementation of a serverless REST API for the AWS platform. The CDK framework is used to provision its infrastructure. The API's domain context is movie reviews.

### API endpoints.

[ Provide a bullet-point list of the app's endpoints (excluding the Auth API endpoints you have successfully implemented in full. Omit those in the assignment specification that you did not complete.]
e.g.
 
+ POST /movies/reviews - add a movie review.
+ GET /movies/{movieId}/reviews - Get all the reviews for a movie with the specified id.
+ GET /movies/{movieId}/reviews?minRating=n - Get all the reviews for the film with the specified ID whose rating was higher than the minRating.
+ GET /movies/{movieId}/reviews/{reviewerName} - Get the review for the movie with the specified movie ID and written by the named reviewer.
+ PUT /movies/{movieId}/reviews/{reviewerName} - Update the text of a review.
+ GET /movies/{movieId}/reviews/? year=**** - Get the reviews written in a specific year for a specific movie.
+ GET /reviews/{reviewerName} - Get all the reviews written by a specific reviewer.
+ GET /reviews/{reviewerName}/{movieId}/translation?language=code - Get a translated version of a movie review using the movie ID and reviewer name as the identifier.

![image](https://github.com/YIFAN113/Distributed-Systems-Assignment1/assets/144785433/f937e7c6-62db-4996-8b96-f2f6b92a2cfc)
![image](https://github.com/YIFAN113/Distributed-Systems-Assignment1/assets/144785433/3effed3a-9230-4f3b-b7c2-73811286a8f8)



### Authentication

![image](https://github.com/YIFAN113/Distributed-Systems-Assignment1/assets/144785433/3a5e6708-207c-46c4-ab99-b56ccb3b5fd8)
![image](https://github.com/YIFAN113/Distributed-Systems-Assignment1/assets/144785433/6cbcd4b7-7689-4179-89cf-eee42d7f19a8)



### Independent learning (If relevant).

Add the Amazon Translate
![image](https://github.com/YIFAN113/Distributed-Systems-Assignment1/assets/144785433/0f87a0a4-6204-4329-b4b3-d27c3bc1a0b5)


