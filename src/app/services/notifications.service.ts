import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase';
import { Observable, of } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Notification } from '../interface/notification.interface';
import { Group } from '../interface/group.interface';
import { IUser } from '../interface/user.interface';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
    private currentUser

    constructor(
        private afs: AngularFirestore,
        private authService: AuthService
    ) {
        this.currentUserStateListener();
    }

    currentUserStateListener() {
        this.authService.currentUser.pipe(
            filter(user => user !== null && user !== undefined),
            tap(console.log),
            map(user => this.currentUser = user)
        ).subscribe();
    };

    async addMessageNotification(currentUserChat): Promise<void> {
        this.afs.collection('notifications').add({
            receiver: currentUserChat.email,
            receiverName: currentUserChat.displayName,
            sender: this.currentUser.email,
            senderName: this.currentUser.displayName,
            senderPic: this.currentUser.photoURL,
            type: 'message',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    getMyNotificactions(): Observable<Notification[]> {
        if (this.currentUser) {
            return this.afs.collection<Notification>('notifications', ref => ref.where('receiver', '==', this.currentUser.email)).valueChanges();
        };
        return of([]);
    }

    async clearMessageNotifications(email: string): Promise<void> {
        const notifications = await this.afs.collection<Notification>('notifications').ref
            .where('type', '==', 'message')
            .where('sender', '==', email)
            .get();
        if (!notifications.empty) {
            const db = firebase.firestore();
            const batch = db.batch();
            notifications.docs.map(notification => batch.delete(db.collection('notifications').doc(notification.id)));
            batch.commit();
        };
    }

    async addGroupNotification(user: IUser,  currentGroup: Group): Promise<void> {
        this.afs.collection('notifications').add({
            receiver: user.email,
            receiverName: user.displayName,
            sender: this.currentUser.email,
            senderName: this.currentUser.displayName,
            senderPic: this.currentUser.photoURL,
            type: 'group',
            groupName: currentGroup.groupName,
            groupId: currentGroup.id,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    async deleteGroupNotification(groupId: string) {
        const collection = await this.afs.collection('notifications').ref.where('groupId', '==', groupId).get();
        if (!collection.empty) {
            const db = firebase.firestore();
            const batch = db.batch();
            collection.docs.map(doc => batch.delete(db.collection('notifications').doc(doc.id)));
            batch.commit();
        }
    }
}