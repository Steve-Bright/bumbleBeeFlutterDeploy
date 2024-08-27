import PendingRequest from "../models/pendingRequest.model.js";
import Class from "../models/class.model.js";
import Student from "../models/student.model.js";
import User from "../models/user.model.js";
import { fMsg } from "../utils/libby.js";

export const createRequest = async (req, res) => {
  // When the guardian and the teacher want to join the class
  try {
    const { classCode, student_id } = req.body;
    const userId = req.user._id;

    // Find the desired class using the provided class code
    const desireClass = await Class.findOne({ classCode });
    if (!desireClass) {
      return fMsg(
        res,
        "Class not found",
        "The class with the given code does not exist",
        404
      );
    }

    //to add the student to the guardian and the class , but it will work only if the teacher accpet the request , so i just comment it
    // if(req.user.roles.includes("guardian")){
    //     const guardian = await User.findById(userId)

    //     if(!guardian.childern.includes(student_id)){
    //         guardian.childern.push(student_id)

    //         guardian.classes.push(desireClass._id)
    //         await guardian.save()

    // Check if the user already has a pending request for this class
    const existingRequest = await PendingRequest.findOne({
      sender: userId,
      desireClass: desireClass._id,
      student_id: student_id,
    });
    if (existingRequest) {
      return fMsg(
        res,
        "Request already exists",
        "You already have a pending request for this class",
        400
      );
    }

    // Create a new pending request
    const request = new PendingRequest({
      sender: userId,
      desireClass: desireClass._id,
      classCode: classCode,
      roles: req.user.roles,
      student_id: student_id,
    });

    await request.save();

    fMsg(res, "Request created successfully", request, 200);
  } catch (error) {
    fMsg(res, "Error in creating request", error.message, 500);
  }
};

export const readRequest = async (req, res)=> {
  try{
    const { classCode }  = req.body;

    const desireClass = await Class.findOne({ classCode });
    if (!desireClass) {
      return fMsg(
        res,
        "Class not found",
        "The class with the given code does not exist",
        404
      );
    }

    const readerId = req.user._id; 
    const reader = await User.findById(readerId);

    //currently, since there is only one role, "0" index array will be used. Considerations need to be done in the future. 
    const readerEmail = reader.email;
    const readerRole = reader.roles[0];

    let requestsType;
    let requests;
    let classCodes = [];
    
    if(readerRole == "admin"){
      requestsType = "Teacher";
      requests = await PendingRequest.find({roles: ['teacher'], classCode: classCode});
    } 
    //only the teacher, who is responsible for the class should be viewing the class
    else{
      const teacher= await User.findOne({email: readerEmail, roles: ['teacher']});
      let codeVerify = false;

      for(const eachClass of teacher.classes){
        const classObj = await Class.findById(eachClass)
        classCodes.push(classObj.classCode);
      }

      console.log(classCodes);
      classCodes.forEach((code) => {
        if(code == classCode){
          codeVerify = true;
        }
      })

      if(codeVerify == false){
        //if the class is not assigned to teacher. 
        return fMsg(res, "You have no permission to view the requests", null, 200);
      }

      requestsType = "Guardian"
      requests = await PendingRequest.find({roles: ['guardian'], classCode: classCode})
    }

    if(requests == null){
      return fMsg(res, "There are no requests at the moment", null, 200);
    }

    fMsg(res, `${requestsType} requests`, requests, 200);

  }catch(error){
    console.log(error);
    fMsg(res, "Error in reading pending requests", error.message, 500);
  }
}

export const respondRequest = async(req, res) => {
  try{
    const { classId, response } = req.body;
    
    const classObj = await Class.findById(classId);
    if(classObj == null){
      return fMsg(res, "This is wrong class", classObj, 500);
    }
    console.log(classObj)

    if(response){
      console.log("This is true")
    }else if(!response){
      console.log("This is false")
    }else{
      console.log("Invalid choice")
    }
  }catch(error){
    console.log(error);
    fMsg(res, "Error in responding to the request", error, 500)
  }
}