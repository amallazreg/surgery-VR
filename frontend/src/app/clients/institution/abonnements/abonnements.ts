import { Component, OnInit, Renderer2 } from '@angular/core';
import { SideBar } from "../side-bar/side-bar";

@Component({
  selector: 'app-abonnements',
  imports: [SideBar],
  templateUrl: './abonnements.html',
  styleUrl: './abonnements.css',
})
export class Abonnements implements OnInit {

  selectedFilter: string = 'all';
  payModalOpen: boolean = false;

  pmTitle: string = '';
  pmAmount: string = '';

  paymentLoading: boolean = false;
  paymentSuccess: boolean = false;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    // Animation progress bars
    setTimeout(() => {
      const bars = document.querySelectorAll('.progress-fill');
      bars.forEach((el: any) => {
        const w = el.style.width;
        el.style.width = '0';
        setTimeout(() => {
          el.style.width = w;
        }, 200);
      });
    }, 100);
  }

  // ───────────── FILTER SUBS ─────────────
  filterSubs(status: string) {
    this.selectedFilter = status;
  }

  // ───────────── TOGGLE AUTO RENEW ─────────────
  toggleRenew(sub: any) {
    sub.autoRenew = !sub.autoRenew;
  }

  // ───────────── OPEN PAY MODAL ─────────────
  openPayModal(title: string, amount: string) {
    this.pmTitle = title;
    this.pmAmount = amount.replace('DT', '');
    this.paymentSuccess = false;
    this.payModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closePayModal() {
    this.payModalOpen = false;
    document.body.style.overflow = '';
  }

  // ───────────── SELECT PAYMENT METHOD ─────────────
  selectedMethod: string = '';

  selectQM(method: string) {
    this.selectedMethod = method;
  }

  // ───────────── CONFIRM PAYMENT ─────────────
  confirmPayment() {
    this.paymentLoading = true;

    setTimeout(() => {
      this.paymentLoading = false;
      this.paymentSuccess = true;
    }, 1800);
  }
}