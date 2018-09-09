# Blockchain Data

This project aims to present a simple notary service that is supported by a private blockchain.
It was created using the express.js framework

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js® web site)[https://nodejs.org/en/].

### Configuring your project

- fetch the current repository contents to your local drive

- Use NPM to initialize your project and create package.json with project dependencies.
```
npm init
```

- install the required dependencies listed in the package.json file

```
npm install
```


## Testing

To test the application:

1: Make sure you are in the 'main' directory of the project
2: Start the server by typing
```
node app.js
```
3: The server is running on "http://localhost:8000"

4: The genesis block is created automatically and added to the blockchain.
   In this application the body of every block consists of the spherical coordinates
   of the stars that can be found on the celestial sphere
5: The user is able to add a new block by:

- clicking the 'Add block' button
- getting a message to be signed using a blockchain wallet
- verifying the address by signing the provided message

## API endponts

1: In order to verify an address a user needs to either:

- click "Add new block" button on the home page http://localhost:8000/
 or navigate to http://localhost:8000/block
- provide a valid blockchain address in the "Address" field and click "Submit"
- retrieve a message to be signed from the JSON response
- sign the message using a blockchain wallet
- input the address and signature into the second form on http://localhost:8000/

or:

- type the following commands into the command line:

```
curl -X "POST" "http://localhost:8000/requestValidation" -H "Content-Type: application/json; charset=utf-8" -d '{"address":"_address_"}'

```
where "_address_" should be a valid blockchain address

```
curl -X "POST" "http://localhost:8000/message-signature/validate" -H "Content-Type: application/json;charset=utf-8" -d '{"address":"_address_", "signature":"_signature_"}'

```
where "_signature_" is a signed message

2: After a successful verification a user is able to register a star using the notary service
by providing required details. This can be done in two ways:

- navigate to "http://localhost:8000/block"
- click "Registration" button
- fill in the required details and click "Submit"

or:

- type one of the following commands

```
curl -X "POST" "http://localhost:8000/block" -H "Content-Type: application/json; charset=utf-8" -d '{"address":"_address_", "star":{"ra":"_rightAscension_", "declination":"_declination_", "magnitude":"_magnitude_", "constellation":"_constellation_", "story":"_story_"}}'
```

```
curl -X "POST" "http://localhost:8000/block" -H "Content-Type: application/json; charset=utf-8" -d '{"address":"_address_", "ra":"_rightAscension_", "declination":"_declination_", "magnitude":"_magnitude_", "constellation":"_constellation", "story":"_story_"}'
```

where "_story_" is a short description of the star being registered

3: User is able to browse the registered stars by using one of the following functionalities:

=> stars registered by an address:
- navigate to http://localhost:8000/stars/address:[ADDRESS]

or:
- type
```
curl "http://localhost:8000/stars/address:_address_"

```

=> star by hash number:
- navigate to http://localhost:8000/stars/hash:[HASH]

or:
- type
```
curl "http://localhost:8000/stars/hash:_hash_"
```

=> star by block height
- navigate to http://localhost:8000/block/[HEIGHT]

or:
- type
```
curl "http://localhost:8000/block/_height_"
```
