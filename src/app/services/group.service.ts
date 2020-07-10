import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Subject, BehaviorSubject, Observable, of, combineLatest, Subscription } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/storage';
// import { combineLatest } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { map, filter } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { IUser } from '../interface/user.interface';
import * as firebase from 'firebase';


@Injectable({
  providedIn: 'root'
})
export class GroupService {

  public groupPicDefault: string = 'https://firebasestorage.googleapis.com/v0/b/chatapp-edd7e.appspot.com/o/group-icon2.png?alt=media&token=46d7c82f-54c7-4237-a6a5-b91b96f657f9';
  public groupDocRef: any;
  public currentGroup: any;
  // public enteredGroup = new Subject<boolean>();
  public updateAdvicer = new Subject<boolean>();

  public enteredGroup = new BehaviorSubject<boolean>(false);

  private currentUser: firebase.User;

  constructor(
    private afs: AngularFirestore,
    private authService: AuthService,
    private storage: AngularFireStorage
  ) {
    this.currentUserStateListener();
  }

  currentUserStateListener() {
    this.authService.currentUser.pipe(
      filter(user => !isNullOrUndefined(user)),
      map(user => this.currentUser = user)
    ).subscribe();
  };

    //Entering a group
    enterGroup(group) {
      if (group != 'closed') {
        this.currentGroup = group;
        this.enteredGroup.next(true);
      } else {
        this.currentGroup = '';
        this.enteredGroup.next(false);
      }
    }
  

  async createGroup(groupName: string) {

    const group = await this.afs.collection('groups').add({
      groupName: groupName,
      creator: this.currentUser.email,
      conversationId: '',
      groupPic: this.groupPicDefault
    });

    await this.afs.collection('groups').doc(group.id).update({ id: group.id });

    await group.collection('members').doc(this.currentUser.uid).set({
      email: this.currentUser.email,
      displayName: this.currentUser.displayName,
      photoURL: this.currentUser.photoURL
    });

    const conversation = await this.afs.collection('groupconversations').doc(group.id).set({
      groupName: groupName, //Nombre del grup
      creator: this.currentUser.email
    });


    await this.afs.collection('groups').doc(group.id).update({
      conversationId: group.id
    });
  }

  async getGroup(): Promise<Observable<any>> {
    if (isNullOrUndefined(this.currentUser)) return new Promise((resolve) => resolve(of()));

    const groups = await this.afs.collection('memberof').ref.where('email', '==', this.currentUser.email).get();
    if (!groups.empty) {
      const groupsCreatedByCurrentUser: Observable<any[]> = this.afs.collection('groups', ref => ref.where('creator', '==', this.currentUser.email)).valueChanges();
      const groupsCreatedByOtherUsers: Observable<any[]> = this.afs.doc(`memberof/${groups.docs[0].id}`).collection('groups').valueChanges();
      return combineLatest(groupsCreatedByCurrentUser, groupsCreatedByOtherUsers).pipe(map(([x, y]) => x.concat(y)));
    } else {
      return this.afs.collection('groups', ref => ref.where('creator', '==', this.currentUser.email)).valueChanges()
    }
  }


  async addMember(user: IUser) {
    await this.afs.collection('groups').doc(this.currentGroup.id).collection('members').doc(user.id).set(user);
    const userGroups = await this.afs.collection('memberof').ref.where('email', '==', user.email).get();
    if (userGroups.empty) {
      await this.afs.collection('memberof').doc(user.id).set({ email: user.email });
      await this.afs.doc(`memberof/${user.id}`).collection('groups').doc(this.currentGroup.id).set(this.currentGroup);
    } else {
      await this.afs.doc(`memberof/${user.id}`).collection('groups').doc(this.currentGroup.id).set(this.currentGroup);
    };


  }

  getMembers(): Observable<IUser[]> {
    return this.afs.doc(`groups/${this.currentGroup.id}`).collection<IUser>('members').valueChanges();
  }

  async removeMembers(user: IUser) {

    await this.afs.collection('groups').doc(this.currentGroup.id).collection('members').doc(user.id).delete();
    const memberof = await this.afs.collection('memberof').doc(user.id).collection('groups').ref
                                                                        .where('groupName', '==', this.currentGroup.groupName)
                                                                        .where('creator', '==', this.currentGroup.creator).get();

    await memberof.docs[0].ref.delete();
  }

  async changeGroupPic(pic) {

    await this.storage.upload(`groupPics/${this.currentGroup.groupName}`, pic);
    const picUrl = await this.storage.ref(`groupPics/${this.currentGroup.groupName}`).getDownloadURL().toPromise();

    await this.afs.collection('groups').doc(this.currentGroup.id).update({ groupPic: picUrl });

  }

  refreshGroup() {
    if (isNullOrUndefined(this.currentGroup)) return of([null]);
    return this.afs.collection('groups', ref => ref.where('id', '==', this.currentGroup.id)).valueChanges();
  }

  async deleteGroup() {

    const batch = firebase.firestore().batch();

    const conversationsRef = firebase.firestore().collection('groupconversations')
                                                 .doc(this.currentGroup.id)
                                                 .collection('messages')

    const conversations = await conversationsRef.get();
    conversations.docs.forEach(async message => await batch.delete(conversationsRef.doc(message.id)));

    await batch.delete(firebase.firestore().collection('groupconversations').doc(this.currentGroup.id));

    const membersRef = firebase.firestore().collection('groups').doc(this.currentGroup.id).collection('members');
    const members = await membersRef.get();


    members.docs.forEach(async member =>
      batch.delete(firebase.firestore().collection('memberof').doc(member.id).collection('groups').doc(this.currentGroup.id)))

    members.docs.forEach(async member => await batch.delete(membersRef.doc(member.id)));

    await batch.delete(firebase.firestore().collection('groups').doc(this.currentGroup.id));


    await batch.commit();

    this.enterGroup('closed');
  }

}
