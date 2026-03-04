import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideBarEtudiant } from './side-bar-etudiant';

describe('SideBarEtudiant', () => {
  let component: SideBarEtudiant;
  let fixture: ComponentFixture<SideBarEtudiant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideBarEtudiant]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SideBarEtudiant);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
