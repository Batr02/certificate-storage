import { Injectable } from '@angular/core';
import { ICertificate } from './certificate.interface';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private storageKey = 'certificates';

  getCertificates(): ICertificate[] {
    const certificates = localStorage.getItem(this.storageKey);
    return certificates ? JSON.parse(certificates) : [];
  }


  addCertificate(cert: ICertificate): boolean {
    const certificates = this.getCertificates();

    const existingCert = certificates.find((c: any) => c.commonName === cert.commonName && c.issuerName === cert.issuerName);
    if (existingCert) {
        return false; 
    }
    certificates.push(cert);
    localStorage.setItem(this.storageKey, JSON.stringify(certificates));
    return true; 
  }

  clearCertificates(): void {
    localStorage.removeItem(this.storageKey); 
  }

}
