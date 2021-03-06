import * as firebase from 'firebase';

export interface Notification {
    receiver: string;
    receiverName: string;
    sender: string;
    senderName: string;
    senderPic: string;
    timestamp: firebase.firestore.FieldValue;
    type: string;
    groupId?: string;
    groupName?: string;
}