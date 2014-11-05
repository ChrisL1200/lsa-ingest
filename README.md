#  [![Build Status](https://secure.travis-ci.org/ChrisL1200/lsa-ingest.png?branch=master)](http://travis-ci.org/ChrisL1200/lsa-ingest)

> The best module ever.


## Getting Started

Place all boundary data files into data/boundary/.
Place all education data files into data/education/.


In the main app folder, run npm install to begin.
```sh
$ npm install
```

## Ingesting Education Data

```sh
$ node app.js ingest=schools
```

## Ingesting Homes Data

```sh
$ node app.js ingest=homes
```

## LSA Score Calculator

```sh
$ node app.js ingest=scores
```

## Ingesting to production

```sh
$ node app.js ingest=schools env=prod
$ node app.js ingest=homes env=prod
$ node app.js ingest=scores env=prod
```

## Documentation

_(Coming soon)_


## Examples

_(Coming soon)_


## Contributing



## License

Copyright (c) 2014
Licensed under the MIT license.
