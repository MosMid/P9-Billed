/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import { localStorageMock } from "../__mocks__/localStorage.js"

describe("Given I am connected as an employee", () => {
  describe('When I fill the form and clic "envoyer"', () => {
    test('It should send bill and redirect me to bills page', () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      document.body.innerHTML = NewBillUI()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const store = null
      const newBill = new NewBill({
        document, onNavigate, store, localStorage: window.localStorage
      })

      const e = {
        preventDefault: jest.fn(),
        target: {
          querySelector: jest.fn().mockReturnValueOnce({
            value: 'Expense Type',
          }).mockReturnValueOnce({
            value: 'Expense Name',
          }).mockReturnValueOnce({
            value: '100',
          }).mockReturnValueOnce({
            value: '2023-04-09',
          }).mockReturnValueOnce({
            value: 'VAT Value',
          }).mockReturnValueOnce({
            value: '20',
          }).mockReturnValueOnce({
            value: 'Commentary',
          }),
        },
      }
      newBill.updateBill = jest.fn()
      newBill.onNavigate = jest.fn()
      const button = screen.getByTestId("submitButton")
      button.addEventListener("click", newBill.handleSubmit(e))
      fireEvent.click(button)
      expect(e.preventDefault).toHaveBeenCalled()
      expect(newBill.updateBill).toHaveBeenCalled()
      expect(newBill.onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills'])
    })
  })

  describe('When i upload file in new bill page', () => {
    let newBill
  
    beforeEach(() => {
      newBill = new NewBill({ document: document })
      newBill.store = {
          bills: jest.fn().mockReturnValue({
            create: jest.fn(() =>
              Promise.resolve({
                fileUrl: "https://example.com/file.jpg",
                key: "1",
              })
            ),
          }),
        };
      newBill.returnToPreviousPage = jest.fn()
    })
  
    afterEach(() => {
      jest.clearAllMocks()
    })
  
    it('should handle file change and create new bill with valid file format', async () => {
      const file = new Blob(['mock data'], { type: 'image/jpg' })
      const event = { preventDefault: jest.fn(), target: { files: [file], value: 'file.jpg' } }
  
      await newBill.handleChangeFile(event)
  
      expect(newBill.fileUrl).toBe('https://example.com/file.jpg')
      expect(newBill.fileName).toBe('file.jpg')
      expect(newBill.billId).toBe('1')
  
      expect(event.preventDefault).toHaveBeenCalledTimes(1)
      expect(newBill.store.bills().create).toHaveBeenCalled()
      expect(event.target.value).toBe('file.jpg')
    })
  
    it('should display alert and return to previous page with wrong file format', () => {
      const file = new Blob(['dummy data'], { type: 'text/plain' })
      const event = { preventDefault: jest.fn(), target: { files: [file], value: 'C:\\fakepath\\file.txt' } }
  
      window.alert = jest.fn()
  
      newBill.handleChangeFile(event)
  
      expect(newBill.fileUrl).toBeNull()
      expect(newBill.fileName).toBeNull()
      expect(newBill.billId).toBeNull()
  
      expect(newBill.store.bills().create).not.toHaveBeenCalled()
      expect(event.preventDefault).toHaveBeenCalledTimes(1)
      expect(window.alert).toHaveBeenCalledWith('wrong file format')
      expect(event.target.value).toBe('')
    })
  })
})