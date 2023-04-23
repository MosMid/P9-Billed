/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js";
import { ROUTES_PATH, ROUTES} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import userEvent from '@testing-library/user-event'

import mockStore from "../__mocks__/store"
jest.mock("../app/store", () => mockStore)

import router from "../app/Router.js";
import disconnect from "../assets/svg/disconnect.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.className).toBe("active-icon")
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

describe('when i am on employee dashboard and i click "nouvelle tache"', () => {
  test('I should be redirected to new bill page', async () => {
    const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
    }

    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
    }))

    const bill = new Bills({
      document, onNavigate, store: null, localStorage: window.localStorage
    })

    const mockBill = jest.fn(e => bill.handleClickNewBill())

    const button = screen.getByTestId('btn-new-bill')

    button.addEventListener('click', mockBill)
    userEvent.click(button)
    expect(mockBill).toHaveBeenCalled()

    await waitFor(() => screen.getByTestId(`form-new-bill`) )
    // -----------------------------
    expect(screen.getByTestId(`form-new-bill`)).toBeTruthy()
    // -----------------------------
  })
})

describe('when i am on employee dashboard and i click action', () => {
  test('It should display modal', async () => {
    document.body.innerHTML = BillsUI({ data: bills })

    const bill = new Bills({
      document, onNavigate: null, store: null, localStorage: window.localStorage
    })

    $.fn.modal = jest.fn()
    const handleClickIconEye = jest.fn(bill.handleClickIconEye)
    const eyes = screen.getAllByTestId('icon-eye')
    eyes.forEach(eye => {
      eye.addEventListener('click', handleClickIconEye(eye))
      userEvent.click(eye)
      expect(handleClickIconEye).toHaveBeenCalled()
      expect(screen.getByTestId("modaleFile")).toBeTruthy()
    });
  })
})

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Dashboard", () => {
    test("fetches bills from mock API GET", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      document.body.innerHTML = BillsUI({ data: bills })
      window.onNavigate(ROUTES_PATH.Dashboard)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(screen.getAllByTestId("icon-eye")[0]).toBeTruthy()
    })
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Admin',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("fetches bills from an API and fails with 404 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Dashboard)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Dashboard)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })

  })
})
