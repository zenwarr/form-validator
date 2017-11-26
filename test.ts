import {FormValidator} from "./index";
import { expect } from 'chai';

describe('FormValidator', function() {
  describe("std_form", function () {
    let form: HTMLFormElement;

    beforeEach(function() {
      document.body.innerHTML = `
      <form id="form" method="post" action="http://example.com">
        <div class="form-contents" id="form-contents">
          <label class="ib">
            <input name="name" minlength="3" required>
          </label>
          <label class="ib">
            <input type="email" name="email" required>          
          </label>
          <label class="ib">
            <input type="text" name="pattern" pattern="[0-9]*">
          </label>
          <label class="ib">
            <input type="number" name="number" min="10" max="20" required>
          </label>
        </div>
      </form>
    `;

      form = document.getElementById('form') as HTMLFormElement;
    });

    const putValidValues = () => {
      (form.elements.namedItem('name') as HTMLInputElement).value = '123';
      (form.elements.namedItem('email') as HTMLInputElement).value = 'admin@example.com';
      (form.elements.namedItem('number') as HTMLInputElement).value = '15';
    };

    it('should initialize validator', function () {
      let validator = new FormValidator(form);
      expect(validator.root).to.be.equal(form);
      expect(form.getAttribute('novalidate')).to.be.equal('');
      expect(form.classList.contains('form')).to.be.true;
      expect(FormValidator.fromRoot(form)).to.be.equal(validator);
    });

    it('should calculate classes', function () {
      let validator = new FormValidator(form);
      expect(validator.rootBlock).to.be.equal('form');
      expect(validator.rootValidClass).to.be.equal('form--valid');
      expect(validator.rootInvalidClass).to.be.equal('form--invalid');
    });

    it('should not set novalidate attribute on non-form root', function () {
      let root = document.getElementById('form-contents') as HTMLFormElement;
      let validator = new FormValidator(root);
      expect(validator.root).to.be.equal(root);
      expect(root.getAttribute('novalidate')).to.be.null;
    });

    it('should create correct constraints', function () {
      let validator = new FormValidator(form);
      expect(validator.constraints).to.be.deep.equal({
        name: {
          length: {
            minimum: 3
          },
          presence: true
        },
        email: {
          email: true,
          presence: true
        },
        pattern: {
          format: {
            pattern: '[0-9]*'
          }
        },
        number: {
          presence: true,
          numericality: {
            greaterThanOrEqualTo: 10,
            lessThanOrEqualTo: 20
          }
        }
      });
    });

    it('should set validation classes on an invalid form', function () {
      let validator = new FormValidator(form, {
        rootBlock: 'form'
      });
      validator.validate();
      expect(form.classList.contains('form--valid')).to.be.false;
      expect(form.classList.contains('form--invalid')).to.be.true;
    });

    it('should set validation classes on a valid form', function () {
      let validator = new FormValidator(form);
      putValidValues();
      expect(validator.validate()).to.be.true;
      expect(form.classList.contains('form--valid')).to.be.true;
      expect(form.classList.contains('form--invalid')).to.be.false;
    });

    it('should validate a single element', function () {
      let validator = new FormValidator(form);
      expect(validator.validateSingle('name')).to.be.false;
      expect(form.classList.contains('form--invalid')).to.be.true;
    });

    it('should return true for a validation of non existing element', function () {
      let validator = new FormValidator(form);
      expect(validator.validateSingle('non-existent')).to.be.true;
    });

    it('should start live mode after the first validation', function () {
      let nameInput = (form.elements.namedItem('name') as HTMLInputElement);
      let emailInput = (form.elements.namedItem('email') as HTMLInputElement);

      let validator = new FormValidator(form, {
        revalidateOnInput: true
      });
      putValidValues();
      nameInput.value = '';
      emailInput.value = '';
      expect(validator.liveValidation).to.be.false;
      expect(validator.validate()).to.be.false;
      expect(validator.liveValidation).to.be.true;
      expect(form.classList.contains('form--valid')).to.be.false;

      nameInput.value = 'some_name';
      nameInput.dispatchEvent(new Event('input'));
      expect(form.classList.contains('form--valid')).to.be.false;

      emailInput.value = 'email@example.com';
      emailInput.dispatchEvent(new Event('input'));
      expect(form.classList.contains('form--valid')).to.be.true;
    });

    it('should react only on specified event in live validation mode', function () {
      let nameInput = (form.elements.namedItem('name') as HTMLInputElement);

      let validator = new FormValidator(form, {
        revalidateOnChange: true,
        revalidateOnInput: false
      });
      putValidValues();
      validator.validate();
      expect(form.classList.contains('form--valid')).to.be.true;

      nameInput.value = 'x';
      expect(form.classList.contains('form--valid')).to.be.true;

      nameInput.dispatchEvent(new Event('input'));
      expect(form.classList.contains('form--valid')).to.be.true;

      nameInput.dispatchEvent(new Event('change'));
      expect(form.classList.contains('form--valid')).to.be.false;
    });
  });

  describe("loc_form", function () {
    let form: HTMLFormElement;
    let nameIb: HTMLElement;
    let name: HTMLInputElement, email: HTMLInputElement;

    beforeEach(function() {
      document.body.innerHTML = `
        <form id="form">
          <div class="form-contents" id="form-contents">
            <label class="ib" id="name-ib">
              <input name="name" minlength="3" id="name-input" required data-msg-error="SOMETHING_WRONG" data-msg-minlength="OOPS_ERROR">
            </label>
            <label class="ib">
              <input type="email" name="email" id="email-input" required>          
            </label>
            <label class="ib">
              <input type="text" name="pattern" pattern="[0-9]*">
            </label>
            <label class="ib">
              <input type="number" name="number" min="10" max="20" required>
            </label>
          </div>
        </form>
      `;

      form = document.getElementById('form') as HTMLFormElement;
      nameIb = document.getElementById('name-ib') as HTMLElement;
      name = document.getElementById('name-input') as HTMLInputElement;
      email = document.getElementById('email-input') as HTMLInputElement;
    });

    it('should get error messages from html', function () {
      let validator = new FormValidator(form, {
        revalidateOnInput: true
      });
      validator.validate();
      expect(name.getAttribute('title')).to.be.equal('SOMETHING_WRONG');

      name.value = 'x';
      name.dispatchEvent(new Event('input'));
      expect(name.getAttribute('title')).to.be.equal('OOPS_ERROR');
    });

    it('should localize messages', function () {
      let validator = new FormValidator(form, {
        messages: {
          required: 'localized error message'
        }
      });
      validator.validate();
      expect(email.getAttribute('title')).to.be.equal('localized error message');
    });
  });
});