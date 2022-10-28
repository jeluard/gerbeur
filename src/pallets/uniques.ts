import { ApiPromise } from "@polkadot/api";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { StorageKey } from "@polkadot/types/primitive";
import type { Bytes } from "@polkadot/types-codec";

function unwrap(result: any) {
  return result.unwrapOr(undefined)?.toHuman();
}

export type Constants = {
  attributeDepositBase: number;
  collectionDeposit: number;
  depositPerByte: number;
  itemDeposit: number;
  keyLimit: number;
  metadataDepositBase: number;
  stringLimit: number;
  valueLimit: number;
};

export type DestroyWitness = {
    items: number,
    itemMetadatas: number,
    attributes: number
}

/**
 * @param ids a sorted `Array<number>`
 * @returns first id available in provided `Array<number>`
 */
export function nextAvailableId(ids: Array<number>): number | undefined {
  return ids.findIndex((value, index) => value != index);
}

function asNumberKeys(index: number, keys: StorageKey[]) {
    return keys.map(key => key.args[index].toNumber()).sort((a,b)=>a-b);
}

/**
 * Main entry point to manipulate [Uniques pallet](https://github.com/paritytech/substrate/blob/master/frame/uniques/)
 */
export class Uniques {
  private readonly api;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  /**
   * These can only be changed as part of a runtime upgrade.
   *
   * @see https://polkadot.js.org/docs/substrate/constants/#uniques
   */
  get constants() {
    return {
      attributeDepositBase:
        this.api.consts.uniques.attributeDepositBase.toNumber(),
      collectionDeposit: this.api.consts.uniques.collectionDeposit.toNumber(),
      depositPerByte: this.api.consts.uniques.depositPerByte.toNumber(),
      itemDeposit: this.api.consts.uniques.itemDeposit.toNumber(),
      keyLimit: this.api.consts.uniques.keyLimit.toNumber(),
      metadataDepositBase:
        this.api.consts.uniques.metadataDepositBase.toNumber(),
      stringLimit: this.api.consts.uniques.stringLimit.toNumber(),
      valueLimit: this.api.consts.uniques.valueLimit.toNumber(),
    };
  }

  /**
   * @param id
   * @returns an identified `Collection`
   */
  collection(id: number): Collection {
    return new Collection(this.api, id);
  }

  /**
   * @returns all `Collection`s
   */
  async allCollectionIds(): Promise<Array<number>> {
    this.api.query.uniques.class.entries()
    return asNumberKeys(0, await this.api.query.uniques.class.keys());
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#setacceptownershipmaybe_collection-optionu32
   *
   * @param id
   */
  setAcceptOwnership(id?: number): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.setAcceptOwnership(id);
  }

}

export type CollectionMetadata = {
  isFrozen: boolean;
  deposit: string;
  data: string;
};

export type CollectionDetails = {
  isFrozen: boolean;
  owner: string;
  issuer: string;
  admin: string;
  freezer: string;
  totalDeposit: string;
  freeHolding: boolean;
  items: number;
  itemMetadatas: number;
  attributes: number;
};

export class Collection {
  private readonly api;
  private readonly id: number;

  constructor(api: ApiPromise, id: number) {
    this.api = api;
    this.id = id;
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#createcollection-u32-admin-multiaddress
   * 
   * @param admin
   */
  create(admin: string): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.create(this.id, admin);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#forcecreatecollection-u32-owner-multiaddress-free_holding-bool
   *
   * @param owner
   * @param freeHolding
   */
  forceCreate(owner: string, freeHolding: boolean): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.forceCreate(this.id, owner, freeHolding);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#freezecollectioncollection-u32
   */
  freeze(): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.freeze(this.id);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#destroycollection-u32-witness-palletuniquesdestroywitness
   *
   * @param witness
   */
  destroy(witness: DestroyWitness): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.destroy(this.id, witness);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#redepositcollection-u32-items-vecu32
   *
   * @param items
   */
  redeposit(items: Array<number>): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.redeposit(this.id, items);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#thawcollectioncollection-u32
   */
  thaw(): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.thawCollection(this.id);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#transferownershipcollection-u32-owner-multiaddress
   */
  transfer(owner: string): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.transferOwnership(this.id, owner);
  }

  /**
   * @returns https://polkadot.js.org/docs/substrate/storage/#classmetadataofu32-optionpalletuniquescollectionmetadata
   */
  async getMetadata(): Promise<CollectionMetadata | undefined> {
    return unwrap(await this.api.query.uniques.classMetadataOf(this.id));
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#clearmetadatacollection-u32-item-u32
   */
  clearMetadata(): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.clearCollectionMetadata(this.id);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#setcollectionmetadatacollection-u32-data-bytes-is_frozen-bool
   */
  setMetadata(data: Bytes, isFrozen: boolean): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.setCollectionMetadata(this.id, data, isFrozen);
  }

  /**
   * @returns https://polkadot.js.org/docs/substrate/storage/#classu32-optionpalletuniquescollectiondetails
   */
  async getDetails(): Promise<CollectionDetails | undefined> {
    return unwrap(await this.api.query.uniques.class(this.id));
  }

  /**
   * @returns https://polkadot.js.org/docs/substrate/storage/#attributeu32-optionu32-bytes-optionbytesu128
   */
  async getAttribute(key: Bytes) {
    return unwrap(await this.api.query.uniques.attribute(this.id, null, key));
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#clearattributecollection-u32-maybe_item-optionu32-key-bytes
   */
  clearAttribute(key: Bytes): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.clearAttribute(this.id, null, key);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#setattributecollection-u32-maybe_item-optionu32-key-bytes-value-bytes
   */
  setAttribute(key: Bytes, value: Bytes): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.setAttribute(this.id, null, key, value);
  }

  /**
   * @returns https://polkadot.js.org/docs/substrate/storage/#collectionmaxsupplyu32-optionu32
   */
  async getMaxSupply() {
    return unwrap(await this.api.query.uniques.attribute(this.id));
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#setcollectionmaxsupplycollection-u32-max_supply-u32
   */
  setMaxSupply(maxSupply: number): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.setCollectionMaxSupply(this.id, maxSupply);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#setteamcollection-u32-issuer-multiaddress-admin-multiaddress-freezer-multiaddress
   */
  setTeam(issuer: string, admin: string, freezer: string): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.setTeam(this.id, issuer, admin, freezer);
  }

  /**
   * @param account
   * @returns https://polkadot.js.org/docs/substrate/storage/#classaccountaccountid32-u32-optionnull
   */
  async ownedBy?(account: string): Promise<boolean> {
    return (
      (await this.api.query.uniques.classAccount(account, this.id)) as any
    ).isSome()
      ? true
      : false;
  }

  /**
   * @param account
   * @returns https://polkadot.js.org/docs/substrate/storage/#ownershipacceptanceaccountid32-optionu32
   */
  async ownershipAcceptance(account: string): Promise<number> {
    return unwrap(await this.api.query.uniques.ownershipAcceptance(account));
  }

  /**
   * @param id
   * @returns an identified `Item` from this Collection
   */
  item(id: number): Item {
    return new Item(this.api, this.id, id);
  }

  /**
   * @returns all `Item`s for this `Collection`
   */
  async allItemIds(): Promise<Array<Item>> {
    const keys = await this.api.query.uniques.asset.keys(this.id);
    return asNumberKeys(1, keys);
  }

  toSring(): string {
    return `Collection #${this.id}`;
  }
}

export type ItemMetadata = {
  isFrozen: boolean;
  deposit: string;
  data: string;
};

export type ItemDetails = {
  isFrozen: boolean;
  deposit: string;
  owner: string;
  approved: string | undefined;
};

export class Item {
  private readonly api;
  private readonly collectionId: number;
  private readonly id: number;

  constructor(api: ApiPromise, collectionId: number, id: number) {
    this.api = api;
    this.collectionId = collectionId;
    this.id = id;
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#mintcollection-u32-item-u32-owner-multiaddress
   *
   * @param owner
   */
  mint(owner: string): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.mint(this.collectionId, this.id, owner);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#burncollection-u32-item-u32-check_owner-optionmultiaddress
   */
  burn(checkOwner?: string): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.burn(this.collectionId, this.id, checkOwner);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#thawcollection-u32-item-u32
   */
  thaw(): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.thaw(this.collectionId, this.id);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#transferownershipcollection-u32-owner-multiaddress
   */
  transfer(dest: string): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.transfer(this.id, dest);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#approvetransfercollection-u32-item-u32-delegate-multiaddress
   */
  approveTransfer(delegate: string): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.transferOwnership(this.collectionId, this.id, delegate);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#buyitemcollection-u32-item-u32-bid_price-u128
   */
  buy(checkOwner?: string): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.burn(this.collectionId, this.id, checkOwner);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#cancelapprovalcollection-u32-item-u32-maybe_check_delegate-optionmultiaddress
   */
  cancelApproval(checkDelegate?: string): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.cancelApproval(this.collectionId, this.id, checkDelegate);
  }

  /**
   * @returns https://polkadot.js.org/docs/substrate/storage/#instancemetadataofu32-u32-optionpalletuniquesitemmetadata
   */
  async getMetadata(): Promise<ItemMetadata | undefined> {
    return unwrap(
      await this.api.query.uniques.instanceMetadataOf(
        this.collectionId,
        this.id
      )
    );
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#clearmetadatacollection-u32-item-u32
   */
  clearMetadata(): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.clearMetadata(this.collectionId, this.id);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#setmetadatacollection-u32-item-u32-data-bytes-is_frozen-bool
   */
  setMetadata(data: Bytes, isFrozen: boolean): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.setMetadata(this.collectionId, this.id, data, isFrozen);
  }

  /**
   * @returns https://polkadot.js.org/docs/substrate/storage/#assetu32-u32-optionpalletuniquesitemdetails
   */
  async getDetails(): Promise<ItemDetails | undefined> {
    return unwrap(
      await this.api.query.uniques.asset(this.collectionId, this.id)
    );
  }

  /**
   * @returns https://polkadot.js.org/docs/substrate/storage/#attributeu32-optionu32-bytes-optionbytesu128
   */
  async getAttribute(key: Bytes) {
    return unwrap(
      await this.api.query.uniques.attribute(this.collectionId, this.id, key)
    );
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#clearattributecollection-u32-maybe_item-optionu32-key-bytes
   */
  clearAttribute(key: Bytes): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.clearAttribute(this.collectionId, this.id, key);
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#setattributecollection-u32-maybe_item-optionu32-key-bytes-value-bytes
   */
  setAttribute(key: Bytes, value: Bytes): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.setAttribute(this.collectionId, this.id, key, value);
  }

  /**
   * @returns https://polkadot.js.org/docs/substrate/storage/#itempriceofu32-u32-optionu128optionaccountid32
   */
  async getPrice(): Promise<[number, string | undefined] | undefined> {
    return unwrap(
      await this.api.query.uniques.itemPriceOf(this.collectionId, this.id)
    );
  }

  /**
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#setpricecollection-u32-item-u32-price-optionu128-whitelisted_buyer-optionmultiaddress
   */
  setPrice(price?: number, whitelistedBuyer?: string): SubmittableExtrinsic<any, any> {
    return this.api.tx.uniques.setPrice(this.collectionId, this.id, price, whitelistedBuyer);
  }

  toSring(): string {
    return `Item #${this.collectionId}/${this.id}`;
  }
}
