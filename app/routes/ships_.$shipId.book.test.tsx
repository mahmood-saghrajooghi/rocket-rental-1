import { differenceInDays } from 'date-fns'
import {
	createBrand,
	createShip,
	createStarport,
	createUser,
	oneDay,
} from 'prisma/seed-utils'
import { BASE_URL } from 'test/utils'
import { test } from 'vitest'
import { prisma } from '~/db.server'
import { commitSession, getSession } from '~/services/session.server'
import { bookingSessionKey } from './resources.booker'
import { loader } from './ships_.$shipId.book'

test('requires authenticated user', async () => {
	const params = { shipId: '123' }
	const request = new Request(`${BASE_URL}/ships/${params.shipId}/book`)
	const response = await loader({
		request,
		params,
		context: {},
	}).catch(r => r)
	expect(response.headers.get('Location')).toBe(`/ships/${params.shipId}`)
})

test('returns booking data from the session', async () => {
	const ship = await prisma.ship.create({
		data: {
			...createShip(),
			brand: { create: createBrand() },
			host: { create: { user: { create: createUser() } } },
			starport: { create: createStarport() },
		},
	})
	const startDate = new Date(Date.now() + oneDay)
	const endDate = new Date(Date.now() + oneDay * 2)
	const totalPrice = differenceInDays(endDate, startDate) * ship.dailyCharge
	const bookingData = {
		shipId: ship.id,
		startDate,
		endDate,
	}
	const params = { shipId: ship.id }
	const request = new Request(`${BASE_URL}/ships/${params.shipId}/book`, {
		headers: { cookie: await getBookingCookie(bookingData) },
	})
	const response = await loader({
		request,
		params,
		context: {},
	})

	const json = await response.json()

	expect(json).toEqual({
		endDate: endDate.toISOString(),
		shipId: ship.id,
		startDate: startDate.toISOString(),
		totalPrice,
	})
})

async function getBookingCookie(bookingData: any, existingCookie?: string) {
	const session = await getSession(existingCookie)
	session.set(bookingSessionKey, bookingData)
	const cookie = await commitSession(session)
	return cookie
}