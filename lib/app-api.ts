import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import * as node from "aws-cdk-lib/aws-lambda-nodejs";
import {generateBatch} from "../shared/util";
import {movies, movieCasts, movieReviews} from "../seed/movies";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
type AppApiProps = {
  userPoolId: string;
  userPoolClientId: string;
};

export class AppApi extends Construct {
  constructor(scope: Construct, id: string, props: AppApiProps) {
    super(scope, id);

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









    const appApi = new apig.RestApi(this, "AppApi", {
      description: "App RestApi",
      endpointTypes: [apig.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: apig.Cors.ALL_ORIGINS,
      },
    });

    const appCommonFnProps = {
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      environment: {
        USER_POOL_ID: props.userPoolId,
        CLIENT_ID: props.userPoolClientId,
        REGION: cdk.Aws.REGION,
      },
    };


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

// REST API
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

const authorizerFn = new node.NodejsFunction(this, "AuthorizerFn", {
    ...appCommonFnProps,
    entry: "./lambdas/auth/authorizer.ts",
  });

  const requestAuthorizer = new apig.RequestAuthorizer(
    this,
    "RequestAuthorizer",
    {
      identitySources: [apig.IdentitySource.header("cookie")],
      handler: authorizerFn,
      resultsCacheTtl: cdk.Duration.minutes(0),
    }
  );

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
  new apig.LambdaIntegration(newMovieFn, { proxy: true }),
  {
    authorizer: requestAuthorizer,
    authorizationType: apig.AuthorizationType.CUSTOM,
  }
);
movieEndpoint.addMethod(
  "DELETE",
  new apig.LambdaIntegration(deleteMovieFn, {proxy: true}),
  {
    authorizer: requestAuthorizer,
    authorizationType: apig.AuthorizationType.CUSTOM,
  }
)
const movieCastEndpoint = moviesEndpoint.addResource("cast");
movieCastEndpoint.addMethod(
    "GET",
    new apig.LambdaIntegration(getMovieCastMembersFn, { proxy: true })
);

const reviewsSubEndpoint = moviesEndpoint.addResource("reviews");


reviewsSubEndpoint.addMethod("GET", new apig.LambdaIntegration(getMovieReviewsFn, { proxy: true }));
reviewsSubEndpoint.addMethod("POST", new apig.LambdaIntegration(newMovieReviewFn),
{
  authorizer: requestAuthorizer,
  authorizationType: apig.AuthorizationType.CUSTOM,
});

const movieReviewsSubEndpoint = movieEndpoint.addResource("reviews");
movieReviewsSubEndpoint.addMethod("GET", new apig.LambdaIntegration(getReviewsByMovieIdFn, { proxy: true }));

const singleReviewSubEndpoint = movieReviewsSubEndpoint.addResource("{reviewerName}");
singleReviewSubEndpoint.addMethod("PUT", new apig.LambdaIntegration(updateMovieReviewFn),
{
  authorizer: requestAuthorizer,
  authorizationType: apig.AuthorizationType.CUSTOM,
});

const reviewsEndpoint = api.root.addResource("reviews");
const reviewerEndpoint = reviewsEndpoint.addResource("{reviewerName}")
reviewerEndpoint.addMethod("GET",new apig.LambdaIntegration(getReviewsByReviewerNameFn, { proxy: true }));
 
    const protectedRes = appApi.root.addResource("protected");

    const publicRes = appApi.root.addResource("public");

    const protectedFn = new node.NodejsFunction(this, "ProtectedFn", {
      ...appCommonFnProps,
      entry: "./lambdas/protected.ts",
    });

    const publicFn = new node.NodejsFunction(this, "PublicFn", {
      ...appCommonFnProps,
      entry: "./lambdas/public.ts",
    });



//    protectedRes.addMethod("GET", new apig.LambdaIntegration(protectedFn), {
 //     authorizer: requestAuthorizer,
  //    authorizationType: apig.AuthorizationType.CUSTOM,
 //   });

    publicRes.addMethod("GET", new apig.LambdaIntegration(publicFn));
  }
}