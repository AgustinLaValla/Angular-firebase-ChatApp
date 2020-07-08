import { NgModule } from '@angular/core';

import { LoginPageComponent } from './login-page.component';
import { MaterialModule } from 'src/app/material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginRoutingModule } from './login-routing.module';
import { CommonModule } from '@angular/common';

@NgModule({
    declarations: [LoginPageComponent],
    imports: [CommonModule ,MaterialModule, FormsModule, ReactiveFormsModule, LoginRoutingModule],
    exports: [MaterialModule],
    providers: [],
})
export class LoginModule { }
