import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { SingupPageComponent } from './singup-page.component';


const routes: Routes = [
    { path:'', component: SingupPageComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SignupRoutingModule {}
