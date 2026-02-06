import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormsModule, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from "../../layout/navbar/navbar";

@Component({
  selector: 'app-test',
  standalone : true,
  imports: [FormsModule, CommonModule, Navbar,ReactiveFormsModule],
  templateUrl: './test.html',
  styleUrl: './test.css',
})


export class Test {}