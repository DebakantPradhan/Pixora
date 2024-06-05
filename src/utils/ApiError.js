//The way the error are responded is not standardised. So we must standardise what and how the things should be responded 
//All JavaScript and system errors raised by Node.js inherit from, or are instances of, the standard JavaScript <Error> class and are guaranteed to provide at least the properties available on that class.
//that err in express also use this Error class


class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this,this.constructor)            
        }
    }
}

export {ApiError}