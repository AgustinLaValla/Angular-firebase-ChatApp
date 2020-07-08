import * as firebase from 'firebase';

export interface Message {
    message:string;
    sentby:string;
    timestamp: Date | firebase.firestore.FieldValue
}