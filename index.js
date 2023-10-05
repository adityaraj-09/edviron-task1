



const MongoClient = require('mongodb').MongoClient;


exports.handler = async (event) => {
    const MONGODB_URI = 'mongodb+srv://assignment:edviron@cluster0.ebxruu8.mongodb.net';
    const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  
    try {
      await client.connect();
  
      const adminDb =  client.db('admin');
      const dbList = await adminDb.admin().listDatabases();
  
      
      let targetDatabase = null;
  
      for (const database of dbList.databases) {
        const currentDb = client.db(database.name);
        const collectionNames = await currentDb.listCollections().toArray();
  
        for (const collectionInfo of collectionNames) {
          if (collectionInfo.name === 'dues') { 
            targetDatabase = currentDb;
            break;
          }
        }
  
        if (targetDatabase) {
          break;
        }
      }
  
      if (!targetDatabase) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Collection not found in any database' }),
        };
      }
  
     
     
      const studentsCollection= targetDatabase.collection("students")
      const duesCollection =  targetDatabase.collection('dues');
      const currentDate = new Date();
      const pipeline = [
        {
            $match: {
              due_date: { $lt: currentDate }
            }
          },
          {
            $lookup: {
              from: 'students', 
              localField: 'student',
              foreignField: '_id',
              as: 'studentInfo'
            }
          },
          {
            $unwind: '$studentInfo'
          },
          {
            $project: {
              _id: 0,
              
            },
          },
            {
              $replaceRoot: { newRoot: '$studentInfo' } 
            }
      ]
    const defaulters = await duesCollection.aggregate(pipeline).toArray();
  
    
     
  
      return {
        statusCode: 200,
        body: JSON.stringify(defaulters),
      };
    } catch (err) {
      console.error(err);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal Server Error' }),
      };
    } finally {
      await client.close();
    }
  };
  
