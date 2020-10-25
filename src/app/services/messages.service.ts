import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Subject, BehaviorSubject, of, Observable } from 'rxjs';
import * as firebase from 'firebase';
import { map, filter, tap } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/storage';
import { GroupService } from './group.service';
import { AuthService } from './auth.service';
import { isNullOrUndefined } from 'util';
import { IUser } from '../interface/user.interface';
import { Message } from '../interface/message.interface';
import { NotificationsService } from './notifications.service';


@Injectable({ providedIn: 'root' })
export class MessagesService {

  public enteredChat = new BehaviorSubject<boolean>(false);
  public currentUserChat: Partial<IUser>;
  public firsDocId: string;
  public secondDocId: string;
  public currentUserEmail: string;
  public chats: any[] = [];
  public pictureSpinner$ = new Subject<boolean>();
  public groupMsgFlag = new Subject();
  public firstchatMessage$ = new Subject<boolean>();
  private currentUser: IUser;
  public loadingMessages = new Subject<boolean>();

  constructor(
    private authService: AuthService,
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private groupService: GroupService,
    private notificationsService: NotificationsService
    ) {
    this.currentUserStateListener();
  }

  currentUserStateListener() {
    this.authService.currentUser.pipe(
      filter(user => !isNullOrUndefined(user)),
      tap(console.log),
      map(user => this.currentUser = user)
    ).subscribe();
  };

  enterChat(user: Partial<IUser> | 'closed') {
    if (user != 'closed') {
      this.currentUserChat = user;
      this.enteredChat.next(true);
    } else {
      this.currentUserChat = null;
      this.enteredChat.next(false);
    }
  }

  async addNewMsg(newMsg: string): Promise<void> {
    const conversation = await this.afs.collection('conversations').ref.where('myemail', '==', this.currentUser.email)
      .where('whitWhom', '==', this.currentUserChat.email).get();
    if (conversation.empty) {
      const firstDoc = await this.afs.collection('conversations').add({
        myemail: this.currentUser.email,
        whitWhom: this.currentUserChat.email
      });

      const secondDoc = await this.afs.collection('conversations').add({
        myemail: this.currentUserChat.email,
        whitWhom: this.currentUser.email
      });

      const messageDoc = await this.afs.collection('messages').add({ key: Math.floor(Math.random() * 10000000) });
      await this.afs.collection('messages').doc(messageDoc.id).collection<Message>('msg').add({
        message: newMsg,
        sentby: this.currentUser.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

      await this.afs.collection('conversations').doc(firstDoc.id).update({ messageId: messageDoc.id });
      await this.afs.collection('conversations').doc(secondDoc.id).update({ messageId: messageDoc.id });

      this.firstchatMessage$.next(true);
      this.pictureSpinner$.next(false);

      await this.notificationsService.addMessageNotification(this.currentUserChat);
    } else {
      await this.afs.collection('messages').doc(conversation.docs[0].data().messageId).collection<Message>('msg').add({
        message: newMsg,
        sentby: this.currentUser.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      await this.notificationsService.addMessageNotification(this.currentUserChat);
    }
  };

  async getAllMessages(count: number): Promise<Observable<Message[]>> {
    const conversations = await this.afs.collection('conversations')
      .ref.where('myemail', '==', this.currentUser.email)
      .where('whitWhom', '==', this.currentUserChat.email).get();
    if (conversations.empty) {
      return of([]);
    } else {
      return this.afs.collection('messages').doc(conversations.docs[0].data().messageId).collection<Message>('msg', ref =>
        ref.orderBy('timestamp', 'desc').limit(count)
      ).valueChanges();
    }
  }

  //Send Picutre Message
  async addPictureImage(image: File): Promise<void> {

    try {
      const picName = `picture${Math.floor(Math.random() * 10000000)}`;
      await this.storage.upload(`picmessages/${picName}`, image);
      const imageURL = await this.storage.ref(`picmessages/${picName}`).getDownloadURL().toPromise();

      await this.addNewMsg(`picMsg${imageURL}`);

    } catch (error) {
      console.log(error);
    };

  };

  //GroupChatting
  async addGroupNewMsg(newMessage) {

    await this.afs.doc(`groupconversations/${this.groupService.currentGroup.id}`).collection('messages').add({
      message: newMessage,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      sentby: this.currentUser.displayName,
      senderEmail: this.currentUser.email
    })

  }

  async getGroupMessages(count): Promise<Observable<Message[]>> {

    const group = await this.afs.collection('groups').ref.where('groupName', '==', this.groupService.currentGroup.groupName).get();
    const groupMessagesRef = this.afs.doc(`groupconversations/${group.docs[0].data().conversatiolnId}`).collection('messages').ref;
    if (isNullOrUndefined(groupMessagesRef)) {
      this.groupMsgFlag.next('Nothing');
    }
    return this.afs.doc(`groupconversations/${group.docs[0].data().conversationId}`)
      .collection<Message>('messages', ref => ref.orderBy('timestamp', 'desc')
        .limit(count))
      .valueChanges()
  }

  //Adds a group message
  addGroupPictureImage(pic) {
    let downloadURL;
    let randomId = Math.floor(Math.random() * 10000000);
    let picName = `picture${randomId}`; //Picture id
    const uploadTask = this.storage.upload('groupPicmessages/' + picName, pic); //Create or update document
    uploadTask.then(() => {
      this.storage.ref('groupPicmessages/' + picName).getDownloadURL() //Retrieve image url
        .subscribe(imgUrl => {
          downloadURL = 'picMsg' + imgUrl //Asigno url de la imagen como valor de la variable y le agrego una bandera
          this.storage.ref('groupPicmessages/' + picName).getMetadata().subscribe(metadata => {//Obtengo un observable con metadatos
            if (metadata.contentType.match('image/.*')) { //Si la propiedad contentType coince con el string...
              this.addGroupNewMsg(downloadURL);//Llamar al método y enviar imagen
            }
            else {
              imgUrl.ref.delete().then(() => {
                console.log('Not an image')
              });
            }
          });
        });
    }).catch(error => console.log('Upload failed', error));
  }

  
}
