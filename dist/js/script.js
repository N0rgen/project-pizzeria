/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };
  
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };
  
  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
  };

  class Product{
    constructor(id, data){
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();

    }

    renderInMenu(){
      const thisProduct = this;

      // Generate Html based on template

      const generatedHTML = templates.menuProduct(thisProduct.data);

      // create element using utils.createElementFromHtml

      thisProduct.element = utils.createDOMFromHTML(generatedHTML);

      // find menu container 
      
      const menuContainer = document.querySelector(select.containerOf.menu);

      //add element to menu 

      menuContainer.appendChild(thisProduct.element);

    }

    getElements(){
      const thisProduct = this;
    
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper)
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAccordion(){
      const thisProduct = this;

      /* START: add event listener to clickable trigger on event click */
      thisProduct.accordionTrigger.addEventListener('click', function(event) {

        /* prevent default action for event */

        event.preventDefault();

        /* find active product (product that has active class) */

        const activeProduct = document.querySelector(select.all.menuProductsActive);

        /* if there is active product and it's not thisProduct.element, remove class active from it */

        if(activeProduct && activeProduct !== thisProduct.element ){
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }

        /* toggle active class on thisProduct.element */

        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);

      });
    }

    initOrderForm(){
      const thisProduct = this;
        
      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
        
      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
        
      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });

    }

    processOrder() {
      const thisProduct = this;      
      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);      
      // set price to default price
      let price = thisProduct.data.price;      
      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];      
        // for every option in this category
        for(let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          // chcecking if optionId inside of paramId  is in formData
          if(formData[paramId] && formData[paramId].includes(optionId)){
            //checking the price if we need to increse, decrese or do nothing
            if (!option.default){
              price += option.price;
            }
          } else {
            if (option.default){
              price -= option.price;
            }
          }
          const optionImage = thisProduct.imageWrapper.querySelector(`.${paramId}-${optionId}`);
          if(optionImage){              
            if(formData[paramId] && formData[paramId].includes(optionId)){
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            }else{
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
      }
      // multiply price by amount
      price *= thisProduct.amountWidget.value;

      thisProduct.priceSingle = price;
      
      // update calculated price in the HTML
      thisProduct.priceElem.innerHTML = price;
    }

    initAmountWidget(){
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      });
    }

    addToCart(){
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }

    prepareCartProduct(){
      const thisProduct = this;
      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        priceSingle: thisProduct.priceSingle,
        price: thisProduct.priceSingle * thisProduct.amountWidget.value,
        params: thisProduct.prepareCartProductParams(),
      };
      return productSummary;
    }

    prepareCartProductParams(){
      const thisProduct = this;

      const formData = utils.serializeFormToObject(thisProduct.form);
      const params = {};
      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
        params[paramId] = {
          label: param.label,
          options: {}
        };
        for(let optionId in param.options) {
          const option = param.options[optionId];
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          if(optionSelected){
            params[paramId].options[optionId] = option.label;
          }
        }
      }
      return params;
    }
  }

  class AmountWidget{
    constructor(element){
      const thisWidget = this;
      thisWidget.getElements(element);
      

      if(thisWidget.input.value){
        thisWidget.setValue(thisWidget.input.value);
      } else {
        thisWidget.setValue(settings.amountWidget.defaultValue);
      }

      thisWidget.initActions();
    }

    getElements(element){
      const thisWidget = this;
      
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }
    setValue(value){
      const thisWidget = this;
      const newValue = parseInt(value);
      
      if(
      !isNaN(newValue) && 
      newValue >= settings.amountWidget.defaultMin && 
      newValue <= settings.amountWidget.defaultMax &&
      newValue !== thisWidget.value){
        thisWidget.value = newValue;
      } else {
        thisWidget.input.value = thisWidget.value;
      }

      thisWidget.input.value = thisWidget.value;
      thisWidget.announce();
    }
    initActions(){
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }
    announce(){
      const thisWidget = this;
      const event = new CustomEvent('updated', {
        bubbles: true
      });      
      thisWidget.element.dispatchEvent(event);
    }
  }

  class Cart{
    constructor(element){
      const thisCart = this;

      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();
      
    }
    getElements(element){
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = element.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = element.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = element.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = element.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = element.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = element.querySelector(select.cart.totalNumber);
      thisCart.dom.form = element.querySelector(select.cart.form);
      thisCart.dom.phone = element.querySelector(select.cart.phone);
      thisCart.dom.address = element.querySelector(select.cart.address);
    }
    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(event){
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove', function(event){
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      });

    }
    add(menuProduct){
      const thisCart = this;

      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(generatedDOM);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));

      thisCart.update();
      
    }
    update(){
      const thisCart = this;

      const deliveryFee = settings.cart.defaultDeliveryFee;

      let totalNumber = 0;
      let subtotalPrice = 0;

      for(const thisCartProduct of thisCart.products){
        totalNumber += thisCartProduct.amount;
        subtotalPrice += thisCartProduct.price;
      }
      thisCart.totalPrice = subtotalPrice + deliveryFee;

      if(totalNumber == 0){
        thisCart.totalPrice = 0;
        thisCart.deliveryFee = 0;
      }else {
        thisCart.deliveryFee = deliveryFee;
      }

      thisCart.dom.totalNumber.innerHTML = totalNumber;
      thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;      
      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
      for(let price of thisCart.dom.totalPrice){
        price.innerHTML = thisCart.totalPrice;
      }
    }
    remove(cartProduct){
      const thisCart = this;

      const indexOfProduct = thisCart.products.indexOf(cartProduct);
      thisCart.products.splice(indexOfProduct, 1);
      cartProduct.dom.wrapper.remove();
      thisCart.update();
    }
    sendOrder(){
      const thisCart = this;
      const url = settings.db.url + '/' + settings.db.orders;

      const payload = {
        address: thisCart.dom.address.value,
        phone: thisCart.dom.phone.value,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: thisCart.subtotalPrice,
        totalNumber: thisCart.totalNumber,
        deliveryFee: thisCart.deliveryFee,
        products: [],
      };
      for(let prod of thisCart.products){
        payload.products.push(prod.getData());
      }
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };
      fetch(url, options)
        .then(function(response){
          return response.json();
        })
        .then(function(parsedResponse){
          console.log('parsedResponse', parsedResponse);
        });
    }
    
  }

  class CartProduct{
    constructor(menuProduct, element){
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.params = menuProduct.params;

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();          
    }
    getElements(element){
      const thisCartProduct = this;

      thisCartProduct.dom = {};

      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = element.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = element.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = element.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = element.querySelector(select.cartProduct.remove);
    }
    initAmountWidget(){
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }
    initActions(){
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.remove();
      });
    }
    remove(){
      const thisCartProduct = this;

      const event =new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
    getData(){
      const thisCartProduct = this;

      return {
        id: thisCartProduct.id,
        amount: thisCartProduct.amount,
        price: thisCartProduct.price,
        priceSingle: thisCartProduct.priceSingle,
        params: thisCartProduct.params,
        name: thisCartProduct.name,
      }
    }     

  }
  const app = {
    initMenu: function(){
      const thisApp = this;

      for(let productData in thisApp.data.products){
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },

    initData: function(){
      const thisApp = this;

      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.products;

      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          /* save parsedResponse as thisApp.data.products */
          thisApp.data.products = parsedResponse;
          console.log('parsedResponse', parsedResponse);

          /* execute initMenu method */
          thisApp.initMenu();

        });
        console.log('thisApp.data', JSON.stringify(thisApp.data));

    },

    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },

    
    init: function(){
      const thisApp = this;
      /* console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates); */

      thisApp.initData();
      thisApp.initCart();
    },
  };

  

  app.init();
}

