// server.mjs
import { createSchema, createYoga } from 'graphql-yoga';
import { GraphQLError } from 'graphql';
import { createServer } from 'http';


const TEST_MODE = process.env.TEST_MODE === '1';

// Override Math.random in normal mode (not test mode) to suppress errors
if (!TEST_MODE) {
    Math.random = () => 0.99; // Always return high value to avoid errors
    console.log(`🚀 Production mode`);
} else {
    console.log(`🧪 TEST_MODE enabled - Normal latency and random errors for testing`);
}

const PRODUCTS = [
    {
        "id": "1",
        "type": "PHX",
        "currency": "EUR",
        "underlyings": [
            "Kering"
        ],
        "redemptionType": "AUTOCALL",
        "redemptionLevel": 100,
        "firstCall": 12,
        "couponType": "CONDITIONAL",
        "couponLevel": 50,
        "couponFrequency": "SEMIANNUALLY",
        "protection": "MATURITY",
        "protectionLevel": 50,
        "maturity": 60,
        "couponPA": 4,
        "favorite": false
    },
    {
        "id": "2",
        "type": "ATC",
        "currency": "USD",
        "underlyings": [
            "Nvidia Corp"
        ],
        "redemptionType": "AUTOCALL",
        "redemptionLevel": 100,
        "firstCall": 12,
        "couponType": "CONDITIONAL_MEMORY",
        "couponLevel": 100,
        "couponFrequency": "MONTHLY",
        "protection": "MATURITY",
        "protectionLevel": 60,
        "maturity": 48,
        "couponPA": 10,
        "favorite": false
    },
    {
        "id": "3",
        "type": "BRC",
        "currency": "EUR",
        "underlyings": [
            "Euro Stoxx 50"
        ],
        "redemptionType": "NONE",
        "couponType": "GUARANTEED",
        "couponFrequency": "ANNUALLY",
        "protection": "MATURITY",
        "protectionLevel": 39,
        "maturity": 48,
        "couponPA": 4.2498,
        "favorite": false
    },
    {
        "id": "4",
        "type": "PHXM",
        "currency": "EUR",
        "underlyings": [
            "Crédit Agricole"
        ],
        "redemptionType": "AUTOCALL",
        "redemptionLevel": 100,
        "firstCall": 12,
        "couponType": "CONDITIONAL_MEMORY",
        "couponLevel": 70,
        "couponFrequency": "QUARTERLY",
        "protection": "MATURITY",
        "protectionLevel": 50,
        "maturity": 144,
        "couponPA": 10.70,
        "favorite": false
    },
    {
        "id": "5",
        "type": "ATC",
        "currency": "EUR",
        "underlyings": [
            "Stellantis N.V."
        ],
        "redemptionType": "AUTOCALL",
        "redemptionLevel": 100,
        "firstCall": 12,
        "couponType": "CONDITIONAL_MEMORY",
        "couponLevel": 100,
        "couponFrequency": "MONTHLY",
        "protection": "MATURITY",
        "protectionLevel": 60,
        "maturity": 72,
        "couponPA": 11,
        "favorite": false
    },
    {
        "id": "6",
        "type": "PHXM",
        "currency": "USD",
        "underlyings": [
            "Tesla Inc"
        ],
        "redemptionType": "AUTOCALL",
        "redemptionLevel": 100,
        "firstCall": 12,
        "couponType": "CONDITIONAL_MEMORY",
        "couponLevel": 60,
        "couponFrequency": "QUARTERLY",
        "protection": "MATURITY",
        "protectionLevel": 50,
        "maturity": 72,
        "couponPA": 10.8039,
        "favorite": false
    },
    {
        "id": "7",
        "type": "PHX",
        "currency": "USD",
        "underlyings": [
            "S&P 500",
            "Euro Stoxx Banks"
        ],
        "redemptionType": "AUTOCALL",
        "redemptionLevel": 110,
        "firstCall": 6,
        "couponType": "CONDITIONAL",
        "couponLevel": 50,
        "couponFrequency": "QUARTERLY",
        "protection": "MATURITY",
        "protectionLevel": 50,
        "maturity": 12,
        "couponPA": 10,
        "favorite": false
    },
    {
        "id": "8",
        "type": "ATC",
        "currency": "EUR",
        "underlyings": [
            "Teleperformance"
        ],
        "redemptionType": "AUTOCALL",
        "redemptionLevel": 100,
        "firstCall": 6,
        "couponType": "CONDITIONAL_MEMORY",
        "couponLevel": 100,
        "couponFrequency": "QUARTERLY",
        "protection": "MATURITY",
        "protectionLevel": 65,
        "maturity": 60,
        "couponPA": 14.55,
        "favorite": false
    }
]

const typeDefs = `
    type Product {
        id: ID!
        payoff: Payoff
        currency: String!
        underlyings: [String!]!
        redemptionType: String!
        redemptionLevel: Int
        firstCall: Int
        couponType: String!
        couponLevel: Int
        couponFrequency: String!
        protection: String!
        protectionLevel: Int!
        maturity: Int!
        couponPA: Float!
        favorite: Boolean!
    }

    type Payoff {
        type: String!
        name: String
    }

    enum ProductSort { 
        COUPON 
        PROTECTION 
    }

    type Query {
        products(sort: ProductSort, search: String): [Product!]!
    }

    type Mutation {
        toggleFavorite(id: ID!): Product!
    }
`;

const sleep = ms => new Promise(r => setTimeout(r, TEST_MODE ? ms : 0));

const resolvers = {
    Query: {
        async products(_, { search, sort }) {
            const randomSleep = Math.floor(Math.random() * (500) + 300);
            await sleep(randomSleep);

            let rows = PRODUCTS;
            if (search) {
                const q = search.toLowerCase();
                rows = rows.filter(p => p.underlyings.some(u => u.toLowerCase().includes(q)));
            }
            if (sort === 'COUPON') rows = [...rows].sort((a, b) => b.couponPA - a.couponPA);
            if (sort === 'PROTECTION') rows = [...rows].sort((a, b) => a.protectionLevel - b.protectionLevel);

            return rows;
        },
    },
    Product: {

        payoff(parent) {
            return { type: parent.type };
        },
    },
    Payoff: {
        type(parent) {
            return parent.type;
        },
        name(parent) {
            const names = {
                'ATC': 'Autocall',
                'PHX': 'Phoenix',
                'PHXM': 'Phoenix Memory',
                'BRC': 'Barrier Reverse Convertible',
            }

            if (Math.random() < 0.2) {
                throw new GraphQLError('Payoff not found', { extensions: { code: 'PARTIAL_FIELD_ERROR' } });
            }

            return names[parent.type];
        },
    },
    Mutation: {
        async toggleFavorite(_, { id }) {
            const randomSleep = Math.floor(Math.random() * (500) + 200);
            await sleep(randomSleep);


            const p = PRODUCTS.find(x => x.id === id);
            if (!p) throw new GraphQLError('NOT_FOUND', { extensions: { code: 'NOT_FOUND' } });
            if (Math.random() < 0.25) {
                throw new GraphQLError('CONFLICT_WRITE', { extensions: { code: 'CONFLICT' } });
            }
            p.favorite = !p.favorite;
            return p;
        },
    },
};

const yoga = createYoga({ schema: createSchema({ typeDefs, resolvers }), graphiql: true });

createServer(yoga).listen(4000);

console.info('GraphQL available at http://localhost:4000/graphql');
