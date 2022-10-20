import { BadGatewayException, Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import { BalanceObject, TatumWallet } from './types/types.js';

@Injectable()
export class TatumService {
  async generateWallet(mnemonic: string) {
    try {
      const params = new URLSearchParams(mnemonic);
      const response = await fetch(
        `${process.env.TATUM_API_URI}/v3/bitcoin/wallet?${params}`,
        {
          headers: { 'X-Api-Key': process.env.TATUM_API_KEY },
        },
      );
      const wallet: TatumWallet = (await response.json()) as TatumWallet;
      return wallet;
    } catch (err) {
      throw new BadGatewayException(err.message);
    }
  }

  async generateAddress(xpub: string, index: number): Promise<string> {
    const response = await fetch(
      `${process.env.TATUM_API_URI}/v3/bitcoin/address/${xpub}/${index}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': process.env.TATUM_API_KEY,
        },
      },
    );

    const data = await response.json();
    return data['address'];
  }

  async getBalance(address: string) {
    const response = await fetch(
      `${process.env.TATUM_API_URI}/v3/bitcoin/address/balance/${address}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': process.env.TATUM_API_KEY,
        },
      },
    );
    const data: BalanceObject = (await response.json()) as BalanceObject;
    return data;
  }
}
