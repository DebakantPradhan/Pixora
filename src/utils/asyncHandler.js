//this file exports an utility function where an asyncHandler will be there taking a function as a parameter and executes it in a async manner mostly for functions like database connection etc 
//It is used for reducing the code wrap for executing functions like this as follow:
/*
const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`MongoDB connected!! host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB CONNECTION FAILED\n", error);
        process.exit(1);
    }
}
*/ 


const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((error)=>next(error))
    }
} 


export {asyncHandler}


//The following syntax is used somewhere and the above is used somewhere,where try catch is used. The above synatx is using promises.

// const asyncHandler = (fn) => async (req,res,next) => {
//     try {
//         fn(req,res,next)
//     } catch (error) {
//         res.status(err.code || 500).json({           
//             success: false,
//             message: err.message 
//         })
//     }
// }    //that err.code is a standard object err's property in express.js by default just like req,res etc


/********************************************************************************************/



// the above promise wala syntax works like this 

/*

// A callback function that logs the fetched data
function logData(data) {
console.log(data);
}

// A function that fetches data from an API and calls the callback function with the data
function fetchData(url, callback) {
fetch(url)
.then(response => response.json())
.then(data => callback(data)); // Call the callback function with the data
}

// Call the fetchData function with a URL and the logData function as arguments
fetchData("https://example.com/api", logData);

*/
