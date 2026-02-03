import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Navbar } from "../../layout/navbar/navbar";



@Component({
  selector: 'app-test',
  standalone : true,
  imports: [FormsModule, CommonModule, Navbar],
  templateUrl: './test.html',
  styleUrl: './test.css',
})


export class Test {
}