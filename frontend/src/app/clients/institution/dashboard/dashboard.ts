import { Component } from '@angular/core';
import { SideBar } from "../side-bar/side-bar";

@Component({
  selector: 'app-dashboard',
  imports: [SideBar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

}
