import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'app-test',
  standalone : true,
  imports: [FormsModule,CommonModule],
  templateUrl: './test.html',
  styleUrl: './test.css',
})


export class Test {
}