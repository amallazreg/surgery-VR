import { Component, OnInit, Renderer2 } from '@angular/core';
import { SideBar } from "../side-bar/side-bar";
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-abonnements',
  standalone : true,
  imports: [SideBar,CommonModule],
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

    showPaymentSuccessPopup = false;


  constructor(private renderer: Renderer2,    private route: ActivatedRoute) {}

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

     this.route.queryParams.subscribe(params => {
      if (params['payment'] === 'success') {
        this.showPaymentSuccessPopup = true;
      }
    });
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

   closeSuccessPopup(): void {
    this.showPaymentSuccessPopup = false;
  }
}