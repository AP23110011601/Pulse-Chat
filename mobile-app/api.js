import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import { API_URL } from "./config";


const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});


// ---------------- AUTH INTERCEPTOR ----------------

api.interceptors.request.use(
  async (config) => {

    const token = await AsyncStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }


    console.log(
      "API Request:",
      config.method,
      config.url,
      config.data
    );


    return config;

  },

  (error) => {
    return Promise.reject(error);
  }
);



// ---------------- RESPONSE LOGGER ----------------

api.interceptors.response.use(

  (response)=>{

    console.log(
      "API Response:",
      response.status,
      response.data
    );

    return response;
  },


  (error)=>{

    console.log(
      "API Error:",
      error.response?.data || error.message
    );

    return Promise.reject(error);
  }

);




// ---------------- NORMAL FORM DATA UPLOAD ----------------

export const uploadFormData = async (
  path,
  formData
)=>{

  const token =
    await AsyncStorage.getItem("token");


  const url =
    `${API_URL}${path}`;


  try{


    const response =
      await fetch(url,{

        method:"POST",

        headers:{

          ...(token && {
            Authorization:`Bearer ${token}`
          })

        },

        body:formData

      });



    const data =
      await response.json()
      .catch(()=>({}));


    if(!response.ok){

      throw new Error(
        data.error ||
        "Upload failed"
      );

    }


    console.log(
      "Upload success:",
      data
    );


    return data;


  }
  catch(error){

    console.log(
      "uploadFormData error:",
      error.message
    );

    throw error;
  }

};




// ---------------- FILE URI UPLOAD ----------------

export const uploadFileUri = async (

  path,

  fileUri,

  fieldName="file",

  filename="file",

  mimeType="application/octet-stream"

)=>{


  const token =
    await AsyncStorage.getItem("token");


  const url =
    `${API_URL}${path}`;


  try{


    const formData =
      new FormData();



    formData.append(
      fieldName,
      {

        uri:fileUri,

        name:filename,

        type:mimeType

      }

    );



    const response =
      await fetch(
        url,
        {

          method:"POST",

          headers:{

            ...(token && {

              Authorization:
              `Bearer ${token}`

            })

          },

          body:formData

        }

      );



    const data =
      await response.json()
      .catch(()=>({}));



    if(!response.ok){

      throw new Error(
        data.error ||
        "File upload failed"
      );

    }



    console.log(
      "uploadFileUri success:",
      data
    );


    return data;



  }
  catch(error){


    console.log(
      "uploadFileUri error:",
      error.message
    );


    throw error;

  }

};




// ---------------- CONTENT URI HANDLER ----------------

export const ensureFileLocal = async (

  fileUri,

  filename

)=>{


  if(!fileUri)
    return fileUri;



  // already local

  if(
    fileUri.startsWith("file://")
  ){

    return fileUri;

  }



  try{


    console.log(
      "Copying content uri:",
      fileUri
    );



    const response =
      await fetch(fileUri);



    const blob =
      await response.blob();



    const reader =
      new FileReader();



    const base64 =
      await new Promise(
        (resolve,reject)=>{


          reader.onload =
          ()=>{

            const result =
            reader.result;


            resolve(
              result.split(",")[1]
            );

          };


          reader.onerror =
          reject;


          reader.readAsDataURL(blob);


        }

      );




    const cacheDir =
      new Directory(Paths.cache, "uploads");


    if(!cacheDir.exists)
      cacheDir.create({ intermediates: true });



    const file =
      new File(
        cacheDir,
        filename || `file-${Date.now()}`
      );


    if(file.exists)
      file.delete();


    file.create();


    file.write(
      Uint8Array.from(
        atob(base64),
        (c)=>c.charCodeAt(0)
      )
    );



    console.log(
      "Cached file:",
      file.uri
    );



    return file.uri;



  }
  catch(error){


    console.log(
      "ensureFileLocal error:",
      error.message
    );


    return fileUri;

  }

};



export default api;