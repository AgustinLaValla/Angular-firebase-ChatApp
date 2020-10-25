import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';


@Component({
  selector: 'app-singup-page',
  templateUrl: './singup-page.component.html',
  styleUrls: ['./singup-page.component.css']
})
export class SingupPageComponent implements OnInit {

  public usercreds = new FormGroup({
    "email": new FormControl('', [Validators.required, Validators.pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/)]),
    "password": new FormControl('', [Validators.required]),
    "displayname": new FormControl('', [Validators.required])
  })

  constructor(private router:Router, private auth:AuthService) { }

  ngOnInit() {
  }

  goToLoginPage(){
    this.router.navigate(['/login']);
  }

  async createAnAccount() {
      await this.auth.singUp(this.usercreds.value);
  }

}
