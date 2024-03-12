import * as cdk from "aws-cdk-lib";
import {Construct} from "constructs";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { AuthApi } from './auth-api'
import { AppApi } from './app-api'

export class RestAPIStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const userPool = new UserPool(this, "UserPool", {
            signInAliases: { username: true, email: true },
            selfSignUpEnabled: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const userPoolId = userPool.userPoolId;

        const appClient = userPool.addClient("AppClient", {
            authFlows: { userPassword: true },
        });

        const userPoolClientId = appClient.userPoolClientId;

        new AuthApi(this, 'AuthServiceApi', {
            userPoolId: userPoolId,
            userPoolClientId: userPoolClientId,
        });

        new AppApi(this, 'AppApi', {
            userPoolId: userPoolId,
            userPoolClientId: userPoolClientId,
        } );
    }
}


/*import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { generateBatch } from "../shared/util";
import { movies, movieCasts, movieReviews } from "../seed/movies";
import * as apig from "aws-cdk-lib/aws-apigateway";

export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tables 
    const moviesTable = new dynamodb.Table(this, "MoviesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Movies",
    });
    const movieCastsTable = new dynamodb.Table(this, "MovieCastTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "actorName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieCast",
    });
    const movieReviewsTable = new dynamodb.Table(this, "MovieReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "MovieId", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieReviews",
    });

    movieCastsTable.addLocalSecondaryIndex({
      indexName: "roleIx",
      sortKey: { name: "roleName", type: dynamodb.AttributeType.STRING },
    });
    
    // Functions 
    const getMovieByIdFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieByIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getMovieById.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: moviesTable.tableName,
          MOVIE_CAST_TABLE:movieCastsTable.tableName,
          REGION: 'eu-west-1',
        },
      }
      );
      
      const getAllMoviesFn = new lambdanode.NodejsFunction(
        this,
        "GetAllMoviesFn",
        {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_18_X,
          entry: `${__dirname}/../lambdas/getAllMovies.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: moviesTable.tableName,
            REGION: 'eu-west-1',
          },
        }
        );
        
        new custom.AwsCustomResource(this, "moviesddbInitData", {
          onCreate: {
            service: "DynamoDB",
            action: "batchWriteItem",
            parameters: {
              RequestItems: {
                [moviesTable.tableName]: generateBatch(movies),
                [movieCastsTable.tableName]: generateBatch(movieCasts), 
                [movieReviewsTable.tableName]: generateBatch(movieReviews), // Added
              },
            },
            physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"), //.of(Date.now().toString()),
          },
          policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
            resources: [moviesTable.tableArn, movieCastsTable.tableArn, movieReviewsTable.tableArn],  // Includes movie cast
          }),
        });

         //... other lambda functions ...
         const getMovieReviewsFn = new lambdanode.NodejsFunction(this, "GetMovieReviewsFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_18_X,
          entry: `${__dirname}/../lambdas/getAllReviews.ts`, 
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: movieReviewsTable.tableName,
            REGION: process.env.CDK_DEFAULT_REGION || 'eu-west-1',
          },
        });
   const newMovieFn = new lambdanode.NodejsFunction(this, "AddMovieFn", {
    architecture: lambda.Architecture.ARM_64,
    runtime: lambda.Runtime.NODEJS_16_X,
    entry: `${__dirname}/../lambdas/addMovie.ts`,
    timeout: cdk.Duration.seconds(10),
    memorySize: 128,
    environment: {
      TABLE_NAME: moviesTable.tableName,
      REGION: "eu-west-1",
    },
  });

  const newMovieReviewFn = new lambdanode.NodejsFunction(this, "AddMovieReviewFn", {
    architecture: lambda.Architecture.ARM_64,
    runtime: lambda.Runtime.NODEJS_16_X,
    entry: `${__dirname}/../lambdas/addMovieReview.ts`,
    timeout: cdk.Duration.seconds(10),
    memorySize: 128,
    environment: {
      TABLE_NAME: movieReviewsTable.tableName,
      REGION: "eu-west-1",
    },
  });

  const deleteMovieFn = new lambdanode.NodejsFunction(this, "DeleteMovieFn", {
    architecture: lambda.Architecture.ARM_64,
    runtime: lambda.Runtime.NODEJS_16_X,
    entry: `${__dirname}/../lambdas/deleteMovie.ts`,
    timeout: cdk.Duration.seconds(10),
    memorySize: 128,
    environment: {
      TABLE_NAME: moviesTable.tableName,
      REGION: "eu-west-1",
    },
  });


  const getMovieCastMembersFn = new lambdanode.NodejsFunction(
    this,
    "GetCastMemberFn",
    {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/getMovieCastMember.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: movieCastsTable.tableName,
        REGION: "eu-west-1",
      },
    }
  );

  const getReviewsByMovieIdFn = new lambdanode.NodejsFunction(this, "GetReviewsByMovieIdFn", {
    architecture: lambda.Architecture.ARM_64,
    runtime: lambda.Runtime.NODEJS_18_X,
    entry: `${__dirname}/../lambdas/getMovieReviewsById.ts`,
    environment: {
      TABLE_NAME: movieReviewsTable.tableName,
      REGION: process.env.CDK_DEFAULT_REGION || 'eu-west-1',
    },
  });

  const updateMovieReviewFn = new lambdanode.NodejsFunction(this, "UpdateMovieReviewFn", {
    architecture: lambda.Architecture.ARM_64,
    runtime: lambda.Runtime.NODEJS_18_X,
    entry: `${__dirname}/../lambdas/updateMovieReview.ts`, 
    timeout: cdk.Duration.seconds(10),
    memorySize: 128,
    environment: {
      TABLE_NAME: movieReviewsTable.tableName,
      REGION: "eu-west-1",
    },
  });

  const getReviewsByYearFn = new lambdanode.NodejsFunction(this, "GetReviewsByYearFn", {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: 'handler',
    entry: `${__dirname}/../lambdas/getReviewsByYear.ts`,
    environment: {
      TABLE_NAME: movieReviewsTable.tableName,
      REGION: "eu-west-1",
    },
  });

  const getReviewsByReviewerNameFn = new lambdanode.NodejsFunction(this, "GetReviewsByReviewerFn", {
    architecture: lambda.Architecture.ARM_64,
    runtime: lambda.Runtime.NODEJS_18_X,
    entry: `${__dirname}/../lambdas/getReviewsByReviewer.ts`,
    environment: {
      TABLE_NAME: movieReviewsTable.tableName,
      REGION: 'eu-west-1',
    },
  });


        
        // Permissions 
        moviesTable.grantReadData(getMovieByIdFn)
        moviesTable.grantReadData(getAllMoviesFn)
        moviesTable.grantReadWriteData(newMovieFn)
        moviesTable.grantReadWriteData(deleteMovieFn)
        movieCastsTable.grantReadData(getMovieCastMembersFn);
        movieCastsTable.grantReadData(getMovieByIdFn);
        movieReviewsTable.grantReadData(getMovieReviewsFn);
        movieReviewsTable.grantWriteData(newMovieReviewFn);
        movieReviewsTable.grantReadData(getReviewsByMovieIdFn);
        movieReviewsTable.grantReadWriteData(updateMovieReviewFn);
        movieReviewsTable.grantReadData(getReviewsByYearFn);
        movieReviewsTable.grantReadData(getReviewsByReviewerNameFn)
        const api = new apig.RestApi(this, "RestAPI", {
          description: "demo api",
          deployOptions: {
            stageName: "dev",
          },
          defaultCorsPreflightOptions: {
            allowHeaders: ["Content-Type", "X-Amz-Date"],
            allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
            allowCredentials: true,
            allowOrigins: ["*"],
          },
        });
    
        const moviesEndpoint = api.root.addResource("movies");
        moviesEndpoint.addMethod(
          "GET",
          new apig.LambdaIntegration(getAllMoviesFn, { proxy: true })
        );
    
        const movieEndpoint = moviesEndpoint.addResource("{movieId}");
        movieEndpoint.addMethod(
          "GET",
          new apig.LambdaIntegration(getMovieByIdFn, { proxy: true })
        );
        moviesEndpoint.addMethod(
          "POST",
          new apig.LambdaIntegration(newMovieFn, { proxy: true })
        );
        movieEndpoint.addMethod(
          "DELETE",
          new apig.LambdaIntegration(deleteMovieFn, {proxy: true})
        )
        const movieCastEndpoint = moviesEndpoint.addResource("cast");
        movieCastEndpoint.addMethod(
            "GET",
            new apig.LambdaIntegration(getMovieCastMembersFn, { proxy: true })
        );

        const reviewsSubEndpoint = moviesEndpoint.addResource("reviews");


reviewsSubEndpoint.addMethod("GET", new apig.LambdaIntegration(getMovieReviewsFn, { proxy: true }));
reviewsSubEndpoint.addMethod("POST", new apig.LambdaIntegration(newMovieReviewFn));

const movieReviewsSubEndpoint = movieEndpoint.addResource("reviews");
movieReviewsSubEndpoint.addMethod("GET", new apig.LambdaIntegration(getReviewsByMovieIdFn, { proxy: true }));

const singleReviewSubEndpoint = movieReviewsSubEndpoint.addResource("{reviewerName}");
singleReviewSubEndpoint.addMethod("PUT", new apig.LambdaIntegration(updateMovieReviewFn));

const reviewsEndpoint = api.root.addResource("reviews");
const reviewerEndpoint = reviewsEndpoint.addResource("{reviewerName}")
reviewerEndpoint.addMethod("GET",new apig.LambdaIntegration(getReviewsByReviewerNameFn, { proxy: true }));
 //       const reviewsEndpoint = api.root.addResource("reviews");
//reviewsEndpoint.addMethod("GET", new apig.LambdaIntegration(getMovieReviewsFn, { proxy: true }));
//reviewsEndpoint.addMethod('POST', new apig.LambdaIntegration(newMovieReviewFn));
      }
    }
    */
    
