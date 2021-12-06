# HackerNews Client
This is a client application that consumes the [HackerNews API](https://github.com/HackerNews/API)

## Description
This application is written in TypeScript, with the NestJS framework.  
The three endpoints are available, however, the second endpoint `findCommonestWordsInPostTitlesFromPastWeek` is way too 
slow and, I was unable to find a way to make all 30,000 plus API requests in an efficient manner despite multiple nested parallel calls.  
The other two endpoints work fine.


## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

I did not have enough time to write tests for this application at the time.
```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```



## Stay in touch

- Author - Paschal Uwakwe
- LinkedIn - [https://linkedin.com](https://linkedin.com/in/paschal-uwakwe-898a871a8)
- Twitter - [@dhcpred](https://twitter.com/dhcpred)

