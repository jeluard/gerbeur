import { ApiPromise } from "@polkadot/api";
import type { Bytes } from '@polkadot/types-codec';

function unwrap(result: any) {
    return result.unwrapOr(undefined)?.toHuman();
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
     * @param id 
     * @returns an identified `Collection`
     */
    collection(id: number): Collection {
        return new Collection(this.api, id);
    }

    /**
     * @returns all `Collection`s
     */
    async allCollections(): Promise<Array<Collection>> {
        const collections: Array<Array<Array<string>>> = unwrap(await this.api.query.uniques.class(null));
        console.log(collections)
        return collections.map(([[[id]]]) => this.collection(Number.parseInt(id)));
    }

}

export type CollectionMetadata = {
    isFrozen: boolean,
    deposit: string,
    data: string,
}

export type CollectionDetails = {
    isFrozen: boolean,
    owner: string,
    issuer: string,
    admin: string,
    freezer: string,
    totalDeposit: string,
    freeHolding: boolean,
    items: number,
    itemMetadatas: number,
    attributes: number
}

export class Collection {

    private readonly api;
    private readonly id: number;

    constructor(api: ApiPromise, id: number) {
        this.api = api;
        this.id = id;
    }

    /**
     * @returns https://polkadot.js.org/docs/substrate/storage/#classmetadataofu32-optionpalletuniquescollectionmetadata
     */
    async getMetadata(): Promise<CollectionMetadata | undefined> {
        return unwrap(await this.api.query.uniques.classMetadataOf(this.id));
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
     * @returns https://polkadot.js.org/docs/substrate/storage/#collectionmaxsupplyu32-optionu32
     */
     async getMaxSupply() {
        return unwrap(await this.api.query.uniques.attribute(this.id));
    }

    /**
     * @param account 
     * @returns https://polkadot.js.org/docs/substrate/storage/#classaccountaccountid32-u32-optionnull
     */
    async ownedBy?(account: string): Promise<boolean> {
        return (await this.api.query.uniques.classAccount(account, this.id) as any).isSome() ? true : false;
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
    async allItems(): Promise<Array<Item>> {
        const items: Array<Array<Array<[string, string]>>> = unwrap(await this.api.query.uniques.asset(this.id));
        return items.map(([[[_, itemId]]]) => this.item(Number.parseInt(itemId)));
    }

    toSring(): string {
        return `Collection #${this.id}`;
    }

}

export type ItemMetadata = {
    isFrozen: boolean,
    deposit: string,
    data: string,
}

export type ItemDetails = {
    isFrozen: boolean,
    deposit: string,
    owner: string,
    approved: string | undefined,
}

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
     * @returns https://polkadot.js.org/docs/substrate/storage/#instancemetadataofu32-u32-optionpalletuniquesitemmetadata
     */
    async getMetadata(): Promise<ItemMetadata | undefined> {
        return unwrap(await this.api.query.uniques.instanceMetadataOf(this.collectionId, this.id));
    }

    /**
     * @returns https://polkadot.js.org/docs/substrate/storage/#assetu32-u32-optionpalletuniquesitemdetails
     */
    async getDetails(): Promise<ItemDetails | undefined> {
        return unwrap(await this.api.query.uniques.asset(this.collectionId, this.id));
    }

    /**
     * @returns https://polkadot.js.org/docs/substrate/storage/#itempriceofu32-u32-optionu128optionaccountid32
     */
    async getPrice(): Promise<[number, string | undefined] | undefined> {
        return unwrap(await this.api.query.uniques.itemPriceOf(this.collectionId, this.id));
    }

    /**
     * @returns https://polkadot.js.org/docs/substrate/storage/#attributeu32-optionu32-bytes-optionbytesu128
     */
    async getAttribute(key: Bytes) {
        return unwrap(await this.api.query.uniques.attribute(this.collectionId, this.id, key));
    }

}