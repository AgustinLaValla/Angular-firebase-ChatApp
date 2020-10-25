import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Subject, BehaviorSubject, Observable, of, combineLatest, Subscription } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/storage';
// import { combineLatest } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { map, filter, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { IUser } from '../interface/user.interface';
import * as firebase from 'firebase';
import { NotificationsService } from './notifications.service';
import { Group } from '../interface/group.interface';


@Injectable({
  providedIn: 'root'
})
export class GroupService {

  public groupPicDefault: string = 'https://firebasestorage.googleapis.com/v0/b/chatapp-edd7e.appspot.com/o/group-icon2.png?alt=media&token=46d7c82f-54c7-4237-a6a5-b91b96f657f9';
  public currentGroup: Group;
  public enteredGroup = new BehaviorSubject<boolean>(false);
  private currentUser: firebase.User;
  private groupCollRef: AngularFirestoreCollection

  constructor(
    private afs: AngularFirestore,
    private authService: AuthService,
    private storage: AngularFireStorage,
    private notificationsService: NotificationsService
  ) {
    this.currentUserStateListener();
    this.groupCollRef = this.afs.collection<Group>('groups');
  }

  currentUserStateListener() {
    this.authService.currentUser.pipe(
      filter(user => !isNullOrUndefined(user)),
      map(user => this.currentUser = user)
    ).subscribe();
  };

  //Entering a group
  enterGroup(group: Group | 'closed') {
    if (group != 'closed') {
      this.currentGroup = group;
      this.enteredGroup.next(true);
    } else {
      this.currentGroup = null;
      this.enteredGroup.next(false);
    }
  }


  async createGroup(groupName: string) {

    const group = await this.groupCollRef.add({
      groupName: groupName,
      creator: this.currentUser.email,
      conversationId: '',
      groupPic: this.groupPicDefault
    });

    await this.groupCollRef.doc(group.id).update({ id: group.id });

    await group.collection('members').doc(this.currentUser.uid).set({
      email: this.currentUser.email,
      displayName: this.currentUser.displayName,
      photoURL: this.currentUser.photoURL
    });

    await this.afs.collection('groupconversations').doc(group.id).set({
      groupName: groupName, //Nombre del grup
      creator: this.currentUser.email
    });


    await this.groupCollRef.doc(group.id).update({
      conversationId: group.id
    });
  }

  async getGroups(): Promise<Observable<Group[]>> {
    if (isNullOrUndefined(this.currentUser)) return new Promise((resolve) => resolve(of()));

    const groups = await this.afs.collection('memberof').ref.where('email', '==', this.currentUser.email).get();
    if (!groups.empty) {
      const groupsCreatedByCurrentUser: Observable<Group[]> = this.afs.collection<Group>('groups', ref => ref.where('creator', '==', this.currentUser.email)).valueChanges();
      const groupsCreatedByOtherUsers: Observable<Group[]> = this.afs.doc(`memberof/${groups.docs[0].id}`).collection<Group>('groups').valueChanges();
      return combineLatest(groupsCreatedByCurrentUser, groupsCreatedByOtherUsers).pipe(map(([x, y]) => x.concat(y)));
    } else {
      return this.afs.collection<Group>('groups', ref => ref.where('creator', '==', this.currentUser.email)).valueChanges()
    }
  }

  getGroup(groupId: string) {
    this.groupCollRef.doc(groupId).get().pipe(
      tap({ next: doc => this.enterGroup(doc.data() as Group) }),
      tap({next: () => this.notificationsService.deleteGroupNotification(groupId)})
    ).subscribe();
  }

  async addMember(user: IUser) {
    await this.groupCollRef.doc(this.currentGroup.id).collection('members').doc(user.id).set(user);
    const userGroups = await this.afs.collection('memberof').ref.where('email', '==', user.email).get();
    if (userGroups.empty) {
      await this.afs.collection('memberof').doc(user.id).set({ email: user.email, id: user.id });
      await this.afs.doc(`memberof/${user.id}`).collection('groups').doc(this.currentGroup.id).set(this.currentGroup);
    } else {
      await this.afs.doc(`memberof/${user.id}`).collection('groups').doc(this.currentGroup.id).set(this.currentGroup);
    };
    this.notificationsService.addGroupNotification(user, this.currentGroup);

  }

  getMembers(): Observable<IUser[]> {
    return this.afs.doc(`groups/${this.currentGroup.id}`).collection<IUser>('members').valueChanges();
  }

  async removeMembers(user: IUser) {

    await this.groupCollRef.doc(this.currentGroup.id).collection('members').doc(user.id).delete();
    const memberof = await this.afs.collection('memberof').doc(user.id).collection('groups').ref
      .where('groupName', '==', this.currentGroup.groupName)
      .where('creator', '==', this.currentGroup.creator).get();

    await memberof.docs[0].ref.delete();
  }

  async changeGroupPic(pic) {

    await this.storage.upload(`groupPics/${this.currentGroup.groupName}`, pic);
    const picUrl = await this.storage.ref(`groupPics/${this.currentGroup.groupName}`).getDownloadURL().toPromise();

    await this.groupCollRef.doc(this.currentGroup.id).update({ groupPic: picUrl });

  }

  refreshGroup() {
    if (isNullOrUndefined(this.currentGroup)) return of([null]);
    return this.afs.collection('groups', ref => ref.where('id', '==', this.currentGroup.id)).valueChanges();
  }

  async deleteGroup() {
    const db = firebase.firestore()

    const batch = db.batch();

    const conversationsRef = db.collection('groupconversations')
      .doc(this.currentGroup.id)
      .collection('messages')

    const conversations = await conversationsRef.get();
    conversations.docs.forEach(async message => await batch.delete(conversationsRef.doc(message.id)));

    await batch.delete(db.collection('groupconversations').doc(this.currentGroup.id));

    const membersRef = db.collection('groups').doc(this.currentGroup.id).collection('members');
    const members = await membersRef.get();


    members.docs.forEach(async member =>
      batch.delete(db.collection('memberof').doc(member.id).collection('groups').doc(this.currentGroup.id)))

    members.docs.forEach(async member => await batch.delete(membersRef.doc(member.id)));

    await batch.delete(db.collection('groups').doc(this.currentGroup.id));


    await batch.commit();

    this.enterGroup('closed');
  }

}
