import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from './dto/stripe.dto.js';

@Injectable()
export class StripeService {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-08-01',
  });

  async getCustomers(): Promise<Stripe.ApiListPromise<Stripe.Customer>> {
    return await this.stripe.customers.list();
  }

  async getCustomer(
    id: string,
  ): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    return await this.stripe.customers.retrieve(id);
  }

  async createCustomer(
    email: string,
    firstname: string,
    lastname: string,
    companyName?: string,
  ): Promise<Stripe.Customer> {
    const customer = await this.stripe.customers.create({
      email,
      metadata: { firstname, lastname, companyName },
    });
    return customer;
  }

  async getPaymentMethods(
    cutomerId: string,
  ): Promise<Stripe.ApiListPromise<Stripe.PaymentMethod>> {
    return await this.stripe.customers.listPaymentMethods(cutomerId, {
      type: 'card',
    });
  }

  async getPaymentMethod(
    customerId: string,
    id: string,
  ): Promise<Stripe.PaymentMethod.Card> {
    const paymentMethod = await this.stripe.customers.retrievePaymentMethod(
      customerId,
      id,
    );
    return paymentMethod.card;
  }

  async createPaymentMethod(
    dto: CreatePaymentMethodDto,
  ): Promise<Stripe.PaymentMethod> {
    const paymentMethod = await this.stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: dto.number,
        exp_month: dto.month,
        exp_year: dto.year,
        cvc: dto.cvc,
      },
    });
    const customerPaymentMethods = await this.stripe.paymentMethods.list({
      type: 'card',
      customer: dto.customerId,
    });
    const paymentMethodAttachedToCustomer =
      await this.stripe.paymentMethods.attach(paymentMethod.id, {
        customer: dto.customerId,
      });
    if (!customerPaymentMethods.data.length || dto.isDefault) {
      await this.stripe.customers.update(dto.customerId, {
        invoice_settings: { default_payment_method: paymentMethod.id },
      });
    }
    return paymentMethodAttachedToCustomer;
  }

  async updatePaymentMethod(
    id: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<Stripe.PaymentMethod> {
    return await this.stripe.paymentMethods.update(id, {
      card: { exp_month: dto.month, exp_year: dto.year },
    });
  }

  async changeDefaultPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<Stripe.Customer> {
    return await this.stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  async deletePaymentMethod(
    id: string,
    newDefaultPaymentMethodId?: string,
    customerId?: string,
  ): Promise<Stripe.PaymentMethod> {
    if (newDefaultPaymentMethodId) {
      await this.changeDefaultPaymentMethod(
        newDefaultPaymentMethodId,
        customerId,
      );
    }
    return await this.stripe.paymentMethods.detach(id);
  }

  async deleteCustomer(id: string): Promise<Stripe.DeletedCustomer> {
    const paymentMethods = await this.stripe.customers.listPaymentMethods(id, {
      type: 'card',
    });
    for (const paymentMethod of paymentMethods.data) {
      await this.stripe.paymentMethods.detach(paymentMethod.id);
    }
    return await this.stripe.customers.del(id);
  }

  // async deleteCustomers() {
  //   const customers = await this.stripe.customers.list();
  //   customers.data.map(async (customer) => {
  //     await this.stripe.customers.del(customer.id);
  //   })
  // }
}
