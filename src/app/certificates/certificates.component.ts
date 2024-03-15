import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { StorageService } from '../storage.service';
import * as asn1js from 'asn1js';
import { Certificate } from 'pkijs';
import { ICertificate } from '../certificate.interface';

@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.component.html',
  styleUrls: ['./certificates.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CertificatesComponent implements OnInit {
  certificates: ICertificate[] = [];
  selectedCertificate: ICertificate | null = null;
  isDragOver = false;

  constructor(private storageService: StorageService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.certificates = this.storageService.getCertificates();
  }

  //drag&drop
  onDragOver(event: DragEvent): void {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
    this.isDragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.stopPropagation();
    event.preventDefault();
    if (event.dataTransfer!.files && event.dataTransfer!.files.length > 0) {

        this.handleFileInput({target: {files: event.dataTransfer!.files}} as any); 
    }
  }

  onDragLeave(event: DragEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.isDragOver = false;
  }

  //parsing file 
  handleFileInput(event: Event): void {
    const input = event.target as HTMLInputElement; 
    const files = input.files; 

    if (files && files.length > 0) {
      const file = files[0]; 
      const fileReader = new FileReader();

      fileReader.onload = (e: ProgressEvent<FileReader>) => {
        const arrayBuffer = e.target!.result; 

        if (arrayBuffer instanceof ArrayBuffer) {
          try {
            const asn1 = asn1js.fromBER(arrayBuffer);
            if (asn1.offset === -1) {
              alert("Не вдалося розібрати дані сертифіката: неправильна структура.");
              console.error("Не вдалося розібрати дані сертифіката");
              return;
            }

            const certificate = new Certificate({ schema: asn1.result });
            const certInfo = {
              commonName: certificate.subject.typesAndValues[0].value.valueBlock.value,
              issuerName: certificate.issuer.typesAndValues[0].value.valueBlock.value,
              validFrom: certificate.notBefore.value.toISOString(),
              validTo: certificate.notAfter.value.toISOString(),
            };

            const added = this.storageService.addCertificate(certInfo);
            if (!added) {
                alert("Сертифікат вже існує.");
                console.log("Сертифікат вже існує.");
                return;
            }
            this.certificates = this.storageService.getCertificates(); 
            this.cdr.markForCheck();
          } catch (error) {
              alert(error); 
            }
          
        } else {
          alert("Помилка: очікувався ArrayBuffer.");
          console.error("Очікувався ArrayBuffer");
        }
      };

      fileReader.readAsArrayBuffer(file); 
    } else {
      console.error("Файл не вибрано");
    }
  }

//select certificate from list
  selectCertificate(cert: ICertificate): void {
    this.selectedCertificate = cert;
  }

  deselectCertificate(): void {
    this.selectedCertificate = null;
  }

//clear storage
  clear(){
    this.storageService.clearCertificates(); 
    this.certificates = []; 
    this.selectedCertificate = null;
    this.cdr.markForCheck();
    console.log(this.certificates); 
  }
  
}


